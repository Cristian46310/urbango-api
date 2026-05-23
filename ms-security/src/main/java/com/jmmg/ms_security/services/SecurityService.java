package com.jmmg.ms_security.services;

import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.jmmg.ms_security.DTOs.auth.ValidateTokenResponseDTO;
import com.jmmg.ms_security.DTOs.email.EmailSendBody;
import com.jmmg.ms_security.DTOs.auth.ValidatedTokenClaims;
import com.jmmg.ms_security.DTOs.user.GetUserDetailDTO;
import com.jmmg.ms_security.DTOs.login.LoginChallengeDTO;
import com.jmmg.ms_security.DTOs.login.LoginDTO;
import com.jmmg.ms_security.DTOs.login.RegisterUserDTO;
import com.jmmg.ms_security.DTOs.login.Verify2FADTO;
import com.jmmg.ms_security.DTOs.password.ForgotPasswordDTO;
import com.jmmg.ms_security.DTOs.password.ResetPasswordDTO;
import com.jmmg.ms_security.infra.config.PasswordResetProperties;
import com.jmmg.ms_security.models.AuthFactor;
import com.jmmg.ms_security.models.User;
import com.jmmg.ms_security.repositories.IUserRepository;

import jakarta.servlet.http.HttpServletRequest;
import reactor.core.publisher.Mono;

@Service
public class SecurityService {

    @Autowired
    private IUserRepository userRepository;
    @Autowired
    private EncryptionService theEncryptionService;
    @Autowired
    private JwtService theJwtService;
    @Autowired
    private GoogleTokenVerifierService theGoogleTokenVerifierService;
    @Autowired
    private AuthFactorService authFactorService;
    @Autowired
    private EmailService emailService;
    @Autowired
    private UserService userService;
    @Autowired
    private RecaptchaService recaptchaService;
    @Autowired
    private AuthenticatedUserService authenticatedUserService;
    @Autowired
    private PasswordResetProperties passwordResetProperties;

    public Mono<LoginChallengeDTO> login(LoginDTO loginUser) {
        return recaptchaService.verifyToken(loginUser.recaptchaToken())
                .flatMap(isValid -> {
                    if (!isValid) {
                        return Mono.error(new IllegalArgumentException("Token de reCAPTCHA inválido"));
                    }

                    var user = new User(loginUser);
                    user = this.userRepository.findByEmail(user.getEmail());

                    if (user != null
                            && user.getPassword().equals(theEncryptionService.convertSHA256(loginUser.password()))) {
                        AuthFactor authFactor = this.authFactorService.createPendingFactor(user);

                        String emailContent = String.format(
                                "Hola %s,\n\n"
                                        + "Tu codigo de autenticacion para iniciar sesion es: %s\n\n"
                                        + "Si no solicitaste este acceso, ignora este mensaje.\n\n"
                                        + "Saludos,\n"
                                        + "Sistema de Seguridad",
                                user.getName(),
                                authFactor.getCode());

                        this.emailService.sendEmail(new EmailSendBody(
                                user.getEmail(),
                                "Codigo de autenticacion",
                                emailContent));

                        return Mono.just(new LoginChallengeDTO(
                                authFactor.getToken(),
                                authFactor.getExpiration(),
                                "Authentication code sent to your email"));
                    }

                    return Mono.error(new IllegalArgumentException("Invalid credentials"));
                });
    }

    public String verifyTwoFactor(Verify2FADTO verify2FADTO) {
        User user = this.authFactorService.validateFactor(verify2FADTO.challengeToken(), verify2FADTO.code());

        if (user == null) {
            return null;
        }

        this.authFactorService.consumeFactor(verify2FADTO.challengeToken());
        return this.theJwtService.generateToken(user);
    }

    public String register(RegisterUserDTO registerUserDTO) {
        if (!registerUserDTO.password().equals(registerUserDTO.confirmPassword())) {
            throw new IllegalArgumentException("Password and confirmation do not match");
        }

        String normalizedEmail = registerUserDTO.email().trim().toLowerCase();
        User existingUser = this.userRepository.findByEmail(normalizedEmail);
        if (existingUser != null) {
            throw new IllegalArgumentException("Email is already registered");
        }

        User newUser = new User();
        newUser.setName((registerUserDTO.name().trim() + " " + registerUserDTO.lastName().trim()).trim());
        newUser.setEmail(normalizedEmail);
        newUser.setPassword(this.theEncryptionService.convertSHA256(registerUserDTO.password()));

        try {
            this.userRepository.save(newUser);
        } catch (DuplicateKeyException e) {
            throw new IllegalArgumentException("Email is already registered");
        }

        String emailContent = String.format(
                "Hola %s,\n\n"
                        + "Tu cuenta ha sido creada exitosamente en el Sistema de Seguridad.\n"
                        + "Ya puedes iniciar sesion con tu correo registrado.\n\n"
                        + "Si no realizaste este registro, contacta al administrador.\n\n"
                        + "Saludos,\n"
                        + "Sistema de Seguridad",
                newUser.getName());

        this.emailService.sendEmail(new EmailSendBody(
                newUser.getEmail(),
                "Confirmacion de creacion de cuenta",
                emailContent));

        return "Cuenta creada exitosamente. Revisa tu correo para confirmar el registro";
    }

    public GetUserDetailDTO me(HttpServletRequest request) {
        User user = this.authenticatedUserService.getAuthenticatedUser(request);
        if (user == null) {
            return null;
        }
        return this.userService.getDetailById(user.getId());
    }

    public ValidateTokenResponseDTO validateToken(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return null;
        }

        String token = authHeader.substring(7);
        ValidatedTokenClaims claims = this.theJwtService.parseValidToken(token);
        if (claims == null) {
            return null;
        }

        if (!this.userRepository.existsById(claims.id())) {
            return null;
        }

        List<String> roles = this.userService.getRoleNamesByUserId(claims.id());

        return new ValidateTokenResponseDTO(
                claims.id(),
                claims.name(),
                claims.email(),
                roles,
                claims.createdAt());
    }

    /**
     * HU-ENTR-1-013: Solicitud de recuperación de contraseña. Always returns a
     * generic message regardless of whether the email exists, to avoid
     * revealing account existence (OWASP information disclosure).
     */
    public String forgotPassword(ForgotPasswordDTO dto) {
        String genericMessage = "Si el email existe, recibirá instrucciones de recuperación";
        Boolean isRecaptchaValid = this.recaptchaService.verifyToken(dto.recaptchaToken()).block();
        if (!Boolean.TRUE.equals(isRecaptchaValid)) {
            throw new IllegalArgumentException("Token de reCAPTCHA inválido");
        }

        String normalizedEmail = dto.email().trim().toLowerCase();
        User user = this.userRepository.findByEmail(normalizedEmail);
        if (user == null) {
            return genericMessage;
        }

        AuthFactor resetFactor = this.authFactorService.createPasswordResetFactor(user);
        String resetLink = this.passwordResetProperties.getBaseUrl() + "?token=" + resetFactor.getToken();
        String emailContent = String.format(
                "Hola %s,\n\n"
                        + "Recibimos una solicitud para restablecer la contraseña de tu cuenta.\n\n"
                        + "Haz clic en el siguiente enlace para crear una nueva contraseña:\n"
                        + "%s\n\n"
                        + "Este enlace es válido por 30 minutos.\n\n"
                        + "Si no solicitaste este cambio, ignora este mensaje. Tu contraseña no será modificada.\n\n"
                        + "Saludos,\n"
                        + "Sistema de Seguridad",
                user.getName(),
                resetLink);

        this.emailService.sendEmail(new EmailSendBody(
                user.getEmail(),
                "Recuperación de contraseña",
                emailContent));

        return genericMessage;
    }

    /**
     * Validates the reset token and updates the password. Returns true on
     * success, false if token is invalid or expired.
     */
    public boolean resetPassword(ResetPasswordDTO dto) {
        User user = this.authFactorService.validatePasswordResetFactor(dto.token());
        if (user == null) {
            return false;
        }

        boolean updated = this.userService.updatePassword(user.getId(), dto.newPassword());
        if (updated) {
            this.authFactorService.consumePasswordResetFactor(dto.token());
        }
        return updated;
    }

    public String loginWithGoogle(String idTokenString) {
        GoogleIdToken.Payload payload = theGoogleTokenVerifierService.verify(idTokenString);
        if (payload == null) {
            return null;
        }

        String email = payload.getEmail();
        String name = (String) payload.get("name");

        User user = this.userRepository.findByEmail(email);
        if (user == null) {
            user = new User();
            user.setEmail(email);
            user.setName(name);
            user.setPassword(theEncryptionService.convertSHA256(UUID.randomUUID().toString()));
            this.userRepository.save(user);
        }
        return theJwtService.generateToken(user);
    }
}
