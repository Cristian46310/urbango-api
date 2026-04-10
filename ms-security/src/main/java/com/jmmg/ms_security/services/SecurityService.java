package com.jmmg.ms_security.services;

import java.util.UUID;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
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
    private GoogleTokenVerifierService theGoogleTokenVerifierService;
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
