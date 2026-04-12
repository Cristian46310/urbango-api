package com.jmmg.ms_security.services;

import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.Date;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import com.jmmg.ms_security.DTOs.login.MicrosoftAuthResultDTO;
import com.jmmg.ms_security.DTOs.login.MicrosoftAuthorizeDTO;
import com.jmmg.ms_security.DTOs.login.MicrosoftTokenResponseDTO;
import com.jmmg.ms_security.DTOs.login.MicrosoftUserProfileDTO;
import com.jmmg.ms_security.DTOs.user.GetUserDTO;
import com.jmmg.ms_security.infra.config.MicrosoftOAuthProperties;
import com.jmmg.ms_security.infra.exception.DataNotFound;
import com.jmmg.ms_security.infra.exception.EntityAlreadyExists;
import com.jmmg.ms_security.infra.exception.MissingData;
import com.jmmg.ms_security.infra.exception.NotPermitted;
import com.jmmg.ms_security.models.MicrosoftAccount;
import com.jmmg.ms_security.models.MicrosoftAuthMode;
import com.jmmg.ms_security.models.MicrosoftAuthRequest;
import com.jmmg.ms_security.models.MicrosoftAuthRequestStatus;
import com.jmmg.ms_security.models.Profile;
import com.jmmg.ms_security.models.User;
import com.jmmg.ms_security.repositories.IMicrosoftAccountRepository;
import com.jmmg.ms_security.repositories.IMicrosoftAuthRequestRepository;
import com.jmmg.ms_security.repositories.IProfileRepository;
import com.jmmg.ms_security.repositories.IUserRepository;

@Service
public class MicrosoftOAuthService {

    @Autowired
    private MicrosoftOAuthProperties microsoftOAuthProperties;

    @Autowired
    private IMicrosoftAuthRequestRepository microsoftAuthRequestRepository;

    @Autowired
    private IMicrosoftAccountRepository microsoftAccountRepository;

    @Autowired
    private IUserRepository userRepository;

    @Autowired
    private IProfileRepository profileRepository;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private RestTemplate restTemplate;

    public MicrosoftAuthorizeDTO createAuthorization(MicrosoftAuthMode mode, String userId) {
        Date now = new Date();
        String codeVerifier = this.generateCodeVerifier();

        MicrosoftAuthRequest authRequest = new MicrosoftAuthRequest();
        authRequest.setState(UUID.randomUUID().toString());
        authRequest.setNonce(UUID.randomUUID().toString());
        authRequest.setCodeVerifier(codeVerifier);
        authRequest.setMode(mode);
        authRequest.setStatus(MicrosoftAuthRequestStatus.PENDING);
        authRequest.setUserId(userId);
        authRequest.setCreatedAt(now);
        authRequest.setUpdatedAt(now);
        authRequest.setExpiration(new Date(now.getTime() + this.resolveStateExpiration()));
        this.microsoftAuthRequestRepository.save(authRequest);

        String authorizationUrl = UriComponentsBuilder
                .fromUriString(this.resolveTenantUrl(this.microsoftOAuthProperties.getAuthorizeUri()))
                .queryParam("client_id", this.microsoftOAuthProperties.getClientId())
                .queryParam("response_type", "code")
                .queryParam("redirect_uri", this.microsoftOAuthProperties.getRedirectUri())
                .queryParam("response_mode", "query")
                .queryParam("scope", this.resolveScope())
                .queryParam("state", authRequest.getState())
                .queryParam("nonce", authRequest.getNonce())
                .queryParam("code_challenge", this.codeChallenge(codeVerifier))
                .queryParam("code_challenge_method", "S256")
                .build()
                .toUriString();

        return new MicrosoftAuthorizeDTO(authorizationUrl);
    }

    public MicrosoftAuthResultDTO handleCallback(String code, String state) {
        if (code == null || code.isBlank() || state == null || state.isBlank()) {
            throw new MissingData("Microsoft code and state are required.");
        }

        MicrosoftAuthRequest authRequest = this.microsoftAuthRequestRepository
                .findByStateAndStatus(state, MicrosoftAuthRequestStatus.PENDING)
                .orElseThrow(() -> new DataNotFound("Microsoft auth request not found."));

        if (this.isExpired(authRequest.getExpiration())) {
            this.markAsCanceled(authRequest);
            throw new NotPermitted("Microsoft auth request expired.");
        }

        MicrosoftTokenResponseDTO tokenResponse = this.exchangeCodeForToken(code, authRequest.getCodeVerifier());
        Jwt idToken = this.decodeAndValidateIdToken(tokenResponse.idToken(), authRequest.getNonce());
        MicrosoftUserProfileDTO profile = this.fetchProfile(tokenResponse.accessToken());

        String providerUserId = this.resolveProviderUserId(profile, idToken);
        String resolvedEmail = this.resolveEmail(profile, idToken);

        authRequest.setMicrosoftUserId(providerUserId);
        authRequest.setMicrosoftName(this.resolveDisplayName(profile, idToken));
        authRequest.setMicrosoftEmail(resolvedEmail);
        authRequest.setMicrosoftPhone(profile.mobilePhone());
        authRequest.setUpdatedAt(new Date());
        this.microsoftAuthRequestRepository.save(authRequest);

        if (authRequest.getMode() == MicrosoftAuthMode.LINK) {
            MicrosoftAuthResultDTO result = this.linkExistingUser(authRequest);
            this.markAsCompleted(authRequest);
            return result;
        }

        Optional<MicrosoftAccount> accountOpt = this.microsoftAccountRepository.findByProviderUserId(providerUserId);
        if (accountOpt.isPresent()) {
            User user = this.userRepository.findById(accountOpt.get().getUserId())
                    .orElseThrow(() -> new DataNotFound("User linked to Microsoft account was not found."));
            this.upsertMicrosoftAccount(user.getId(), authRequest);
            this.upsertProfile(user, authRequest);
            this.markAsCompleted(authRequest);
            return this.authenticatedResult(user, false, "Microsoft account authenticated successfully.");
        }

        if (resolvedEmail == null || resolvedEmail.isBlank()) {
            authRequest.setStatus(MicrosoftAuthRequestStatus.EMAIL_REQUIRED);
            authRequest.setUpdatedAt(new Date());
            this.microsoftAuthRequestRepository.save(authRequest);
            return new MicrosoftAuthResultDTO(
                    "EMAIL_REQUIRED",
                    "Microsoft account does not expose an email. Please provide an alternate email.",
                    null,
                    authRequest.getState(),
                    false,
                    false,
                    null);
        }

        MicrosoftAuthResultDTO result = this.createOrLinkUserByEmail(authRequest, resolvedEmail);
        this.markAsCompleted(authRequest);
        return result;
    }

    public MicrosoftAuthResultDTO completeRegistration(String registrationToken, String email) {
        MicrosoftAuthRequest authRequest = this.microsoftAuthRequestRepository
                .findByStateAndStatus(registrationToken, MicrosoftAuthRequestStatus.EMAIL_REQUIRED)
                .orElseThrow(() -> new DataNotFound("Microsoft registration request not found."));

        if (this.isExpired(authRequest.getExpiration())) {
            this.markAsCanceled(authRequest);
            throw new NotPermitted("Microsoft registration request expired.");
        }

        if (authRequest.getMicrosoftUserId() == null || authRequest.getMicrosoftUserId().isBlank()) {
            throw new MissingData("Microsoft profile data is incomplete for registration.");
        }

        MicrosoftAuthResultDTO result = this.createOrLinkUserByEmail(authRequest, email);
        this.markAsCompleted(authRequest);
        return result;
    }

    public void unlink(String userId) {
        MicrosoftAccount account = this.microsoftAccountRepository.findByUserId(userId)
                .orElseThrow(() -> new DataNotFound("Microsoft account is not linked to this user."));

        User user = this.userRepository.findById(userId)
                .orElseThrow(() -> new DataNotFound("User not found."));

        if (user.getPassword() == null || user.getPassword().isBlank()) {
            throw new NotPermitted("Cannot unlink Microsoft because this account does not have another login method configured.");
        }

        this.microsoftAccountRepository.delete(account);
    }

    private MicrosoftAuthResultDTO createOrLinkUserByEmail(MicrosoftAuthRequest authRequest, String email) {
        User user = this.userRepository.findByEmail(email);
        boolean created = false;

        if (user == null) {
            user = new User();
            user.setName(this.resolveDisplayName(authRequest));
            user.setEmail(email);
            user.setPassword(null);
            user = this.userRepository.save(user);
            created = true;
        }

        Optional<MicrosoftAccount> existingUserAccount = this.microsoftAccountRepository.findByUserId(user.getId());
        if (existingUserAccount.isPresent()
                && !existingUserAccount.get().getProviderUserId().equals(authRequest.getMicrosoftUserId())) {
            throw new EntityAlreadyExists("This user already has a different Microsoft account linked.");
        }

        this.upsertMicrosoftAccount(user.getId(), authRequest);
        this.upsertProfile(user, authRequest);

        return this.authenticatedResult(
                user,
                created,
                created ? "User created and authenticated with Microsoft." : "Existing user authenticated with Microsoft.");
    }

    private MicrosoftAuthResultDTO linkExistingUser(MicrosoftAuthRequest authRequest) {
        if (authRequest.getUserId() == null || authRequest.getUserId().isBlank()) {
            throw new MissingData("Authenticated user is required to link a Microsoft account.");
        }

        User user = this.userRepository.findById(authRequest.getUserId())
                .orElseThrow(() -> new DataNotFound("Authenticated user was not found."));

        Optional<MicrosoftAccount> existingLinkedAccount = this.microsoftAccountRepository
                .findByProviderUserId(authRequest.getMicrosoftUserId());
        if (existingLinkedAccount.isPresent() && !existingLinkedAccount.get().getUserId().equals(user.getId())) {
            throw new EntityAlreadyExists("This Microsoft account is already linked to another user.");
        }

        Optional<MicrosoftAccount> existingUserAccount = this.microsoftAccountRepository.findByUserId(user.getId());
        if (existingUserAccount.isPresent()
                && !existingUserAccount.get().getProviderUserId().equals(authRequest.getMicrosoftUserId())) {
            throw new EntityAlreadyExists("This user already has a different Microsoft account linked.");
        }

        this.upsertMicrosoftAccount(user.getId(), authRequest);
        this.upsertProfile(user, authRequest);

        return new MicrosoftAuthResultDTO(
                "LINKED",
                "Microsoft account linked successfully.",
                null,
                null,
                true,
                false,
                this.buildUserDTO(user));
    }

    private void upsertMicrosoftAccount(String userId, MicrosoftAuthRequest authRequest) {
        MicrosoftAccount account = this.microsoftAccountRepository.findByProviderUserId(authRequest.getMicrosoftUserId())
                .orElseGet(MicrosoftAccount::new);

        Date now = new Date();
        if (account.getCreatedAt() == null) {
            account.setCreatedAt(now);
            account.setLinkedAt(now);
        }

        account.setUserId(userId);
        account.setProviderUserId(authRequest.getMicrosoftUserId());
        account.setDisplayName(authRequest.getMicrosoftName());
        account.setEmail(authRequest.getMicrosoftEmail());
        account.setUpdatedAt(now);

        this.microsoftAccountRepository.save(account);
    }

    private void upsertProfile(User user, MicrosoftAuthRequest authRequest) {
        Profile profile = this.profileRepository.findByUserId(user.getId()).orElseGet(Profile::new);

        if (profile.getId() == null) {
            profile.setUser(user);
        }

        if (authRequest.getMicrosoftPhone() != null && !authRequest.getMicrosoftPhone().isBlank()) {
            profile.setPhone(authRequest.getMicrosoftPhone());
        }

        if (authRequest.getMicrosoftPhotoUrl() != null && !authRequest.getMicrosoftPhotoUrl().isBlank()) {
            profile.setPhoto(authRequest.getMicrosoftPhotoUrl());
        }

        this.profileRepository.save(profile);
    }

    private MicrosoftAuthResultDTO authenticatedResult(User user, boolean created, String message) {
        return new MicrosoftAuthResultDTO(
                "AUTHENTICATED",
                message,
                this.jwtService.generateToken(user),
                null,
                true,
                created,
                this.buildUserDTO(user));
    }

    private GetUserDTO buildUserDTO(User user) {
        return GetUserDTO.fromModelWithRoles(user, null);
    }

    private MicrosoftTokenResponseDTO exchangeCodeForToken(String code, String codeVerifier) {
        HttpHeaders headers = new HttpHeaders();
        headers.setAccept(List.of(MediaType.APPLICATION_JSON));
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("client_id", this.microsoftOAuthProperties.getClientId());
        body.add("client_secret", this.microsoftOAuthProperties.getClientSecret());
        body.add("grant_type", "authorization_code");
        body.add("code", code);
        body.add("redirect_uri", this.microsoftOAuthProperties.getRedirectUri());
        body.add("code_verifier", codeVerifier);
        body.add("scope", this.resolveScope());

        ResponseEntity<MicrosoftTokenResponseDTO> response = this.restTemplate.postForEntity(
                this.resolveTenantUrl(this.microsoftOAuthProperties.getTokenUri()),
                new HttpEntity<>(body, headers),
                MicrosoftTokenResponseDTO.class);

        MicrosoftTokenResponseDTO tokenResponse = response.getBody();
        if (tokenResponse == null || tokenResponse.accessToken() == null || tokenResponse.accessToken().isBlank()) {
            throw new NotPermitted("Failed to exchange Microsoft code for access token.");
        }

        if (tokenResponse.idToken() == null || tokenResponse.idToken().isBlank()) {
            throw new NotPermitted("Microsoft did not return an id_token.");
        }

        return tokenResponse;
    }

    private Jwt decodeAndValidateIdToken(String idToken, String expectedNonce) {
        String jwkSetUri = this.resolveTenantUrl(this.microsoftOAuthProperties.getJwkSetUri());

        NimbusJwtDecoder decoder = NimbusJwtDecoder.withJwkSetUri(jwkSetUri).build();
        Jwt jwt;
        try {
            jwt = decoder.decode(idToken);
        } catch (JwtException ex) {
            throw new NotPermitted("Invalid Microsoft id_token.");
        }

        String audience = jwt.getAudience() == null || jwt.getAudience().isEmpty() ? null : jwt.getAudience().get(0);
        if (audience == null || !audience.equals(this.microsoftOAuthProperties.getClientId())) {
            throw new NotPermitted("Invalid Microsoft id_token audience.");
        }

        String nonce = jwt.getClaimAsString("nonce");
        if (expectedNonce != null && !expectedNonce.equals(nonce)) {
            throw new NotPermitted("Invalid Microsoft id_token nonce.");
        }

        return jwt;
    }

    private MicrosoftUserProfileDTO fetchProfile(String accessToken) {
        String profileUrl = this.microsoftOAuthProperties.getGraphUri()
                + "/v1.0/me?$select=id,displayName,givenName,surname,mail,userPrincipalName,mobilePhone";

        ResponseEntity<MicrosoftUserProfileDTO> response = this.restTemplate.exchange(
                URI.create(profileUrl),
                HttpMethod.GET,
                new HttpEntity<Void>(this.microsoftHeaders(accessToken)),
                MicrosoftUserProfileDTO.class);

        MicrosoftUserProfileDTO profile = response.getBody();
        if (profile == null || profile.id() == null || profile.id().isBlank()) {
            throw new NotPermitted("Failed to fetch Microsoft user profile.");
        }

        return profile;
    }

    private HttpHeaders microsoftHeaders(String accessToken) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);
        headers.setAccept(List.of(MediaType.APPLICATION_JSON));
        return headers;
    }

    private String resolveProviderUserId(MicrosoftUserProfileDTO profile, Jwt idToken) {
        if (profile.id() != null && !profile.id().isBlank()) {
            return profile.id();
        }

        String oid = idToken.getClaimAsString("oid");
        if (oid != null && !oid.isBlank()) {
            return oid;
        }

        String sub = idToken.getSubject();
        if (sub != null && !sub.isBlank()) {
            return sub;
        }

        throw new NotPermitted("Unable to resolve Microsoft user id.");
    }

    private String resolveEmail(MicrosoftUserProfileDTO profile, Jwt idToken) {
        if (profile.mail() != null && !profile.mail().isBlank()) {
            return profile.mail();
        }

        if (profile.userPrincipalName() != null
                && !profile.userPrincipalName().isBlank()
                && profile.userPrincipalName().contains("@")) {
            return profile.userPrincipalName();
        }

        String emailClaim = idToken.getClaimAsString("email");
        if (emailClaim != null && !emailClaim.isBlank()) {
            return emailClaim;
        }

        String preferredUsername = idToken.getClaimAsString("preferred_username");
        if (preferredUsername != null && !preferredUsername.isBlank() && preferredUsername.contains("@")) {
            return preferredUsername;
        }

        return null;
    }

    private String resolveDisplayName(MicrosoftUserProfileDTO profile, Jwt idToken) {
        if (profile.displayName() != null && !profile.displayName().isBlank()) {
            return profile.displayName();
        }

        String nameClaim = idToken.getClaimAsString("name");
        if (nameClaim != null && !nameClaim.isBlank()) {
            return nameClaim;
        }

        if (profile.givenName() != null && !profile.givenName().isBlank()) {
            return profile.givenName();
        }

        return "Microsoft User";
    }

    private String resolveDisplayName(MicrosoftAuthRequest authRequest) {
        if (authRequest.getMicrosoftName() != null && !authRequest.getMicrosoftName().isBlank()) {
            return authRequest.getMicrosoftName();
        }

        return "Microsoft User";
    }

    private boolean isExpired(Date expiration) {
        return expiration == null || expiration.before(new Date());
    }

    private void markAsCompleted(MicrosoftAuthRequest authRequest) {
        authRequest.setStatus(MicrosoftAuthRequestStatus.COMPLETED);
        authRequest.setUpdatedAt(new Date());
        this.microsoftAuthRequestRepository.save(authRequest);
    }

    private void markAsCanceled(MicrosoftAuthRequest authRequest) {
        authRequest.setStatus(MicrosoftAuthRequestStatus.CANCELED);
        authRequest.setUpdatedAt(new Date());
        this.microsoftAuthRequestRepository.save(authRequest);
    }

    private long resolveStateExpiration() {
        return this.microsoftOAuthProperties.getStateExpiration() != null
                ? this.microsoftOAuthProperties.getStateExpiration()
                : 600000L;
    }

    private String resolveScope() {
        if (this.microsoftOAuthProperties.getScope() != null && !this.microsoftOAuthProperties.getScope().isBlank()) {
            return this.microsoftOAuthProperties.getScope();
        }

        return "openid profile email User.Read";
    }

    private String resolveTenantUrl(String templateUrl) {
        String tenant = this.microsoftOAuthProperties.getTenantId();
        if (tenant == null || tenant.isBlank()) {
            tenant = "common";
        }

        return templateUrl.replace("{tenant}", tenant);
    }

    private String generateCodeVerifier() {
        byte[] randomBytes = new byte[32];
        new SecureRandom().nextBytes(randomBytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);
    }

    private String codeChallenge(String codeVerifier) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(codeVerifier.getBytes(StandardCharsets.US_ASCII));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(hash);
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 algorithm not available.", ex);
        }
    }
}
