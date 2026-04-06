package com.jmmg.ms_security.services;

import java.util.UUID;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
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

    public String login(User loginUser){
        String token=null;
        User user=this.userRepository.findByEmail(loginUser.getEmail());
        if(user!=null &&
                user.getPassword().equals(theEncryptionService.convertSHA256(loginUser.getPassword()))){
            token=theJwtService.generateToken(user);
            return token;
        }else{
            return  token;
        }
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
