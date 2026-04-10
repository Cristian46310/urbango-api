package com.jmmg.ms_security.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.jmmg.ms_security.DTOs.email.EmailSendBody;
import com.jmmg.ms_security.DTOs.login.LoginChallengeDTO;
import com.jmmg.ms_security.DTOs.login.LoginDTO;
import com.jmmg.ms_security.DTOs.login.Verify2FADTO;
import com.jmmg.ms_security.DTOs.password.ForgotPasswordDTO;
import com.jmmg.ms_security.DTOs.password.ResetPasswordDTO;
import com.jmmg.ms_security.models.AuthFactor;
import com.jmmg.ms_security.models.User;
import com.jmmg.ms_security.repositories.IUserRepository;

@Service
public class SecurityService {

    @Autowired
    private IUserRepository userRepository;
    @Autowired
    private EncryptionService theEncryptionService;
    @Autowired
    private JwtService theJwtService;
    @Autowired
    private AuthFactorService authFactorService;
    @Autowired
    private EmailService emailService;
    @Autowired
    private UserService userService;

    public LoginChallengeDTO login(LoginDTO loginUser) {
        var user = new User(loginUser);
        user = this.userRepository.findByEmail(user.getEmail());

        if (user != null
                && user.getPassword() != null
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

            return new LoginChallengeDTO(
                    authFactor.getToken(),
                    authFactor.getExpiration(),
                    "Authentication code sent to your email");
        }

        return null;
    }

    public String verifyTwoFactor(Verify2FADTO verify2FADTO) {
        User user = this.authFactorService.validateFactor(verify2FADTO.challengeToken(), verify2FADTO.code());

        if (user == null) {
            return null;
        }

        this.authFactorService.consumeFactor(verify2FADTO.challengeToken());
        return this.theJwtService.generateToken(user);
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

}
