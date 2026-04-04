package com.jmmg.ms_security.services;

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
    /*
    public boolean permissionsValidation(final HttpServletRequest request,
                                         @RequestBody Permission thePermission) {
        boolean success=this.theValidatorsService.validationRolePermission(request,thePermission.getUrl(),thePermission.getMethod());
        return success;
    }
    */

}
