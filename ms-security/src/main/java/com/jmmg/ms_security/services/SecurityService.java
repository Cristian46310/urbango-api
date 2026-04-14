package com.jmmg.ms_security.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;

import java.util.UUID;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.jmmg.ms_security.DTOs.email.EmailSendBody;
import com.jmmg.ms_security.DTOs.user.GetUserDetailDTO;
import com.jmmg.ms_security.DTOs.login.LoginChallengeDTO;
import com.jmmg.ms_security.DTOs.login.LoginDTO;
import com.jmmg.ms_security.DTOs.login.RegisterUserDTO;
import com.jmmg.ms_security.DTOs.login.Verify2FADTO;
import com.jmmg.ms_security.DTOs.password.ForgotPasswordDTO;
import com.jmmg.ms_security.DTOs.password.ResetPasswordDTO;
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

    public Mono<LoginChallengeDTO> login(LoginDTO loginUser) {
        //validacion captcha
        return recaptchaService.verifyToken(loginUser.recaptchaToken())
                .flatMap(isValid -> {
                    if (!isValid) {
                        return Mono.error(new IllegalArgumentException("Token de reCAPTCHA inválido"));
                    }
                    var user = new User(loginUser);
                    user = this.userRepository.findByEmail(user.getEmail());

                    if (user != null && user.getPassword().equals(theEncryptionService.convertSHA256(loginUser.password()))) {
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

    /**
     * HU-ENTR-1-013: Solicitud de recuperación de contraseña. Always returns a
     * generic message regardless of whether the email exists, to avoid
     * revealing account existence (OWASP information disclosure).
     */
    public String forgotPassword(ForgotPasswordDTO dto) {
        String genericMessage = "Si el email existe, recibirá instrucciones de recuperación";
        User user = this.userRepository.findByEmail(dto.email());
        if (user == null) {
            return genericMessage;
        }

        AuthFactor resetFactor = this.authFactorService.createPasswordResetFactor(user);

        String resetLink = "https://sistema.com/reset-password?token=" + resetFactor.getToken();
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
    /*
    public boolean permissionsValidation(final HttpServletRequest request,
                                         @RequestBody Permission thePermission) {
        boolean success=this.theValidatorsService.validationRolePermission(request,thePermission.getUrl(),thePermission.getMethod());
        return success;
    }
     */

    public String loginWithGoogle(String idTokenString) {
        // Valida el token frente a Google antes de confiar en cualquier dato del usuario.
        GoogleIdToken.Payload payload = theGoogleTokenVerifierService.verify(idTokenString);
        if (payload == null) {
            return null;
        }

        String email= payload.getEmail();
        String name= (String)payload.get("name");

        User user=this.userRepository.findByEmail(email);
        if(user==null){
            user=new User();
            user.setEmail(email);
            user.setName(name);
            // Los usuarios de Google no se autentican con contraseña local, pero el modelo requiere una. Se asigna un valor aleatorio que no se podrá usar para iniciar sesión tradicionalmente.
            user.setPassword(theEncryptionService.convertSHA256(UUID.randomUUID().toString()));
            this.userRepository.save(user);
        }
        return theJwtService.generateToken(user);
    }
}
