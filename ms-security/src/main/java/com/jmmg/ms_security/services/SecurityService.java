package com.jmmg.ms_security.services;

import com.jmmg.ms_security.DTOs.email.EmailSendBody;
import com.jmmg.ms_security.DTOs.login.LoginChallengeDTO;
import com.jmmg.ms_security.DTOs.login.LoginDTO;
import com.jmmg.ms_security.DTOs.login.Verify2FADTO;
import com.jmmg.ms_security.models.AuthFactor;
import com.jmmg.ms_security.models.User;
import com.jmmg.ms_security.repositories.IUserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;


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

    public LoginChallengeDTO login(LoginDTO loginUser) {
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
    /*
    public boolean permissionsValidation(final HttpServletRequest request,
                                         @RequestBody Permission thePermission) {
        boolean success=this.theValidatorsService.validationRolePermission(request,thePermission.getUrl(),thePermission.getMethod());
        return success;
    }
    */

}
