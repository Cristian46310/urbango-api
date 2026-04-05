package com.jmmg.ms_security.controllers;

import com.jmmg.ms_security.DTOs.login.LoginChallengeDTO;
import com.jmmg.ms_security.DTOs.login.LoginDTO;
import com.jmmg.ms_security.DTOs.login.TokenDTO;
import com.jmmg.ms_security.DTOs.login.Verify2FADTO;
import com.jmmg.ms_security.services.SecurityService;

import jakarta.validation.Valid;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@CrossOrigin
@RestController
@RequestMapping("/security")
public class SecurityController {

    @Autowired
    private SecurityService theSecurityService;

    @PostMapping("login")
    public ResponseEntity<LoginChallengeDTO> login(@Valid @RequestBody LoginDTO loginDTO) {
        LoginChallengeDTO challenge = this.theSecurityService.login(loginDTO);
        if (challenge != null) {
            return ResponseEntity.ok(challenge);
        } else {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
    }

    @PostMapping("verify-2fa")
    public ResponseEntity<TokenDTO> verifyTwoFactor(@Valid @RequestBody Verify2FADTO verify2FADTO) {
        String token = this.theSecurityService.verifyTwoFactor(verify2FADTO);
        if (token != null) {
            return ResponseEntity.ok(new TokenDTO(token));
        }
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }
}
