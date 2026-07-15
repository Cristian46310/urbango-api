package com.jmmg.ms_security.services;

import java.net.URI;
import java.util.Arrays;
import java.util.Comparator;
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
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import com.jmmg.ms_security.DTOs.login.GitHubAuthResultDTO;
import com.jmmg.ms_security.DTOs.login.GitHubAuthorizeDTO;
import com.jmmg.ms_security.DTOs.login.GitHubTokenResponseDTO;
import com.jmmg.ms_security.DTOs.login.GitHubUserEmailDTO;
import com.jmmg.ms_security.DTOs.login.GitHubUserProfileDTO;
import com.jmmg.ms_security.DTOs.user.GetUserDTO;
import com.jmmg.ms_security.infra.config.GitHubOAuthProperties;
import com.jmmg.ms_security.infra.exception.DataNotFound;
import com.jmmg.ms_security.infra.exception.EntityAlreadyExists;
import com.jmmg.ms_security.infra.exception.MissingData;
import com.jmmg.ms_security.infra.exception.NotPermitted;
import com.jmmg.ms_security.models.GitHubAccount;
import com.jmmg.ms_security.models.GitHubAuthMode;
import com.jmmg.ms_security.models.GitHubAuthRequest;
import com.jmmg.ms_security.models.GitHubAuthRequestStatus;
import com.jmmg.ms_security.models.User;
import com.jmmg.ms_security.repositories.IGitHubAccountRepository;
import com.jmmg.ms_security.repositories.IGitHubAuthRequestRepository;
import com.jmmg.ms_security.repositories.IUserRepository;

@Service
public class GitHubOAuthService {

    @Autowired
    private GitHubOAuthProperties gitHubOAuthProperties;

    @Autowired
    private IGitHubAuthRequestRepository gitHubAuthRequestRepository;

    @Autowired
    private IGitHubAccountRepository gitHubAccountRepository;

    @Autowired
    private IUserRepository userRepository;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private UserRoleService userRoleService;

    @Autowired
    private RestTemplate restTemplate;

    public GitHubAuthorizeDTO createAuthorization(GitHubAuthMode mode, UUID userId) {
        Date now = new Date();
        GitHubAuthRequest authRequest = new GitHubAuthRequest();
        authRequest.setState(UUID.randomUUID().toString());
        authRequest.setMode(mode);
        authRequest.setStatus(GitHubAuthRequestStatus.PENDING);
        authRequest.setUserId(userId);
        authRequest.setCreatedAt(now);
        authRequest.setUpdatedAt(now);
        authRequest.setExpiration(new Date(now.getTime() + this.gitHubOAuthProperties.getStateExpiration()));
        this.gitHubAuthRequestRepository.save(authRequest);

        String authorizationUrl = UriComponentsBuilder
                .fromUriString(this.gitHubOAuthProperties.getAuthorizeUri())
                .queryParam("client_id", this.gitHubOAuthProperties.getClientId())
                .queryParam("redirect_uri", this.gitHubOAuthProperties.getRedirectUri())
                .queryParam("scope", "read:user user:email")
                .queryParam("state", authRequest.getState())
                .build()
                .toUriString();

        return new GitHubAuthorizeDTO(authorizationUrl);
    }

    public GitHubAuthResultDTO handleCallback(String code, String state) {
        if (code == null || code.isBlank() || state == null || state.isBlank()) {
            throw new MissingData("GitHub code and state are required.");
        }

        GitHubAuthRequest authRequest = this.gitHubAuthRequestRepository
                .findByStateAndStatus(state, GitHubAuthRequestStatus.PENDING)
                .orElseThrow(() -> new DataNotFound("GitHub auth request not found."));

        if (this.isExpired(authRequest.getExpiration())) {
            this.markAsCanceled(authRequest);
            throw new NotPermitted("GitHub auth request expired.");
        }

        String accessToken = this.exchangeCodeForToken(code);
        GitHubUserProfileDTO profile = this.fetchProfile(accessToken);
        String resolvedEmail = this.resolveEmail(accessToken, profile);

        authRequest.setGithubUserId(profile.id());
        authRequest.setGithubUsername(profile.login());
        authRequest.setGithubName(profile.name());
        authRequest.setGithubEmail(resolvedEmail);
        authRequest.setGithubAvatarUrl(profile.avatarUrl());
        authRequest.setGithubProfileUrl(profile.htmlUrl());
        authRequest.setUpdatedAt(new Date());
        this.gitHubAuthRequestRepository.save(authRequest);

        if (authRequest.getMode() == GitHubAuthMode.LINK) {
            GitHubAuthResultDTO result = this.linkExistingUser(authRequest);
            this.markAsCompleted(authRequest);
            return result;
        }

        Optional<GitHubAccount> accountOpt = this.gitHubAccountRepository.findByProviderUserId(profile.id());
        if (accountOpt.isPresent()) {
            User user = this.userRepository.findById(accountOpt.get().getUserId())
                    .orElseThrow(() -> new DataNotFound("User linked to GitHub account was not found."));
            this.upsertGitHubAccount(user.getId(), authRequest);
            this.markAsCompleted(authRequest);
            return this.authenticatedResult(user, false, "GitHub account authenticated successfully.");
        }

        if (resolvedEmail == null || resolvedEmail.isBlank()) {
            authRequest.setStatus(GitHubAuthRequestStatus.EMAIL_REQUIRED);
            authRequest.setUpdatedAt(new Date());
            this.gitHubAuthRequestRepository.save(authRequest);
            return new GitHubAuthResultDTO(
                    "EMAIL_REQUIRED",
                    "GitHub account does not expose a public email. Please provide an alternate email.",
                    null,
                    authRequest.getState(),
                    false,
                    false,
                    null);
        }

        GitHubAuthResultDTO result = this.createOrLinkUserByEmail(authRequest, resolvedEmail);
        this.markAsCompleted(authRequest);
        return result;
    }

    public GitHubAuthResultDTO completeRegistration(String registrationToken, String email) {
        GitHubAuthRequest authRequest = this.gitHubAuthRequestRepository
                .findByStateAndStatus(registrationToken, GitHubAuthRequestStatus.EMAIL_REQUIRED)
                .orElseThrow(() -> new DataNotFound("GitHub registration request not found."));

        if (this.isExpired(authRequest.getExpiration())) {
            this.markAsCanceled(authRequest);
            throw new NotPermitted("GitHub registration request expired.");
        }

        if (authRequest.getGithubUserId() == null || authRequest.getGithubUsername() == null) {
            throw new MissingData("GitHub profile data is incomplete for registration.");
        }

        GitHubAuthResultDTO result = this.createOrLinkUserByEmail(authRequest, email);
        this.markAsCompleted(authRequest);
        return result;
    }

    public void unlink(UUID userId) {
        GitHubAccount account = this.gitHubAccountRepository.findByUserId(userId)
                .orElseThrow(() -> new DataNotFound("GitHub account is not linked to this user."));

        User user = this.userRepository.findById(userId)
                .orElseThrow(() -> new DataNotFound("User not found."));

        if (user.getPassword() == null || user.getPassword().isBlank()) {
            throw new NotPermitted("Cannot unlink GitHub because this account does not have another login method configured.");
        }

        this.gitHubAccountRepository.delete(account);
    }

    private GitHubAuthResultDTO createOrLinkUserByEmail(GitHubAuthRequest authRequest, String email) {
        User user = this.userRepository.findByEmail(email);
        boolean created = false;

        if (user == null) {
            user = new User();
            user.setName(this.resolveDisplayName(authRequest));
            user.setEmail(email);
            user.setPassword(null);
            user = this.userRepository.save(user);
            this.userRoleService.assignDefaultCitizenRole(user);
            created = true;
        }

        Optional<GitHubAccount> existingUserAccount = this.gitHubAccountRepository.findByUserId(user.getId());
        if (existingUserAccount.isPresent()
                && !existingUserAccount.get().getProviderUserId().equals(authRequest.getGithubUserId())) {
            throw new EntityAlreadyExists("This user already has a different GitHub account linked.");
        }

        this.upsertGitHubAccount(user.getId(), authRequest);
        return this.authenticatedResult(
                user,
                created,
                created ? "User created and authenticated with GitHub." : "Existing user authenticated with GitHub.");
    }

    private GitHubAuthResultDTO linkExistingUser(GitHubAuthRequest authRequest) {
        if (authRequest.getUserId() == null) {
            throw new MissingData("Authenticated user is required to link a GitHub account.");
        }

        User user = this.userRepository.findById(authRequest.getUserId())
                .orElseThrow(() -> new DataNotFound("Authenticated user was not found."));

        Optional<GitHubAccount> existingLinkedAccount = this.gitHubAccountRepository.findByProviderUserId(authRequest.getGithubUserId());
        if (existingLinkedAccount.isPresent() && !existingLinkedAccount.get().getUserId().equals(user.getId())) {
            throw new EntityAlreadyExists("This GitHub account is already linked to another user.");
        }

        Optional<GitHubAccount> existingUserAccount = this.gitHubAccountRepository.findByUserId(user.getId());
        if (existingUserAccount.isPresent()
                && !existingUserAccount.get().getProviderUserId().equals(authRequest.getGithubUserId())) {
            throw new EntityAlreadyExists("This user already has a different GitHub account linked.");
        }

        this.upsertGitHubAccount(user.getId(), authRequest);

        return new GitHubAuthResultDTO(
                "LINKED",
                "GitHub account linked successfully.",
                null,
                null,
                true,
                false,
                this.buildUserDTO(user));
    }

    private GitHubAuthResultDTO authenticatedResult(User user, boolean created, String message) {
        return new GitHubAuthResultDTO(
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

    private void upsertGitHubAccount(UUID userId, GitHubAuthRequest authRequest) {
        GitHubAccount account = this.gitHubAccountRepository.findByProviderUserId(authRequest.getGithubUserId())
                .orElseGet(GitHubAccount::new);

        Date now = new Date();
        if (account.getCreatedAt() == null) {
            account.setCreatedAt(now);
            account.setLinkedAt(now);
        }

        account.setUserId(userId);
        account.setProviderUserId(authRequest.getGithubUserId());
        account.setUsername(authRequest.getGithubUsername());
        account.setDisplayName(authRequest.getGithubName());
        account.setEmail(authRequest.getGithubEmail());
        account.setAvatarUrl(authRequest.getGithubAvatarUrl());
        account.setProfileUrl(authRequest.getGithubProfileUrl());
        account.setUpdatedAt(now);

        this.gitHubAccountRepository.save(account);
    }

    private String exchangeCodeForToken(String code) {
        HttpHeaders headers = new HttpHeaders();
        headers.setAccept(List.of(MediaType.APPLICATION_JSON));
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("client_id", this.gitHubOAuthProperties.getClientId());
        body.add("client_secret", this.gitHubOAuthProperties.getClientSecret());
        body.add("code", code);
        body.add("redirect_uri", this.gitHubOAuthProperties.getRedirectUri());

        ResponseEntity<GitHubTokenResponseDTO> response = this.restTemplate.postForEntity(
                this.gitHubOAuthProperties.getTokenUri(),
                new HttpEntity<>(body, headers),
                GitHubTokenResponseDTO.class);

        GitHubTokenResponseDTO tokenResponse = response.getBody();
        if (tokenResponse == null || tokenResponse.accessToken() == null || tokenResponse.accessToken().isBlank()) {
            throw new NotPermitted("Failed to exchange GitHub code for access token.");
        }

        return tokenResponse.accessToken();
    }

    private GitHubUserProfileDTO fetchProfile(String accessToken) {
        ResponseEntity<GitHubUserProfileDTO> response = this.restTemplate.exchange(
                URI.create(this.gitHubOAuthProperties.getApiUri() + "/user"),
                HttpMethod.GET,
                new HttpEntity<Void>(this.githubHeaders(accessToken)),
                GitHubUserProfileDTO.class);

        GitHubUserProfileDTO profile = response.getBody();
        if (profile == null || profile.id() == null || profile.login() == null || profile.login().isBlank()) {
            throw new NotPermitted("Failed to fetch GitHub user profile.");
        }

        return profile;
    }

    private String resolveEmail(String accessToken, GitHubUserProfileDTO profile) {
        if (profile.email() != null && !profile.email().isBlank()) {
            return profile.email();
        }

        ResponseEntity<GitHubUserEmailDTO[]> response = this.restTemplate.exchange(
                URI.create(this.gitHubOAuthProperties.getApiUri() + "/user/emails"),
                HttpMethod.GET,
                new HttpEntity<Void>(this.githubHeaders(accessToken)),
                GitHubUserEmailDTO[].class);

        GitHubUserEmailDTO[] emails = response.getBody();
        if (emails == null || emails.length == 0) {
            return null;
        }

        return Arrays.stream(emails)
                .filter(email -> email.email() != null && !email.email().isBlank())
                .filter(email -> Boolean.TRUE.equals(email.verified()))
                .sorted(Comparator.comparing(email -> !Boolean.TRUE.equals(email.primary())))
                .map(GitHubUserEmailDTO::email)
                .findFirst()
                .orElse(null);
    }

    private HttpHeaders githubHeaders(String accessToken) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);
        headers.setAccept(List.of(MediaType.APPLICATION_JSON));
        headers.set("X-GitHub-Api-Version", "2022-11-28");
        return headers;
    }

    private boolean isExpired(Date expiration) {
        return expiration == null || expiration.before(new Date());
    }

    private void markAsCompleted(GitHubAuthRequest authRequest) {
        authRequest.setStatus(GitHubAuthRequestStatus.COMPLETED);
        authRequest.setUpdatedAt(new Date());
        this.gitHubAuthRequestRepository.save(authRequest);
    }

    private void markAsCanceled(GitHubAuthRequest authRequest) {
        authRequest.setStatus(GitHubAuthRequestStatus.CANCELED);
        authRequest.setUpdatedAt(new Date());
        this.gitHubAuthRequestRepository.save(authRequest);
    }

    private String resolveDisplayName(GitHubAuthRequest authRequest) {
        if (authRequest.getGithubName() != null && !authRequest.getGithubName().isBlank()) {
            return authRequest.getGithubName();
        }

        if (authRequest.getGithubUsername() != null && !authRequest.getGithubUsername().isBlank()) {
            return authRequest.getGithubUsername();
        }

        return "GitHub User";
    }
}
