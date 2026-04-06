package com.jmmg.ms_security.controllers;

import com.jmmg.ms_security.DTOs.login.LoginDTO;
import com.jmmg.ms_security.DTOs.login.TokenDTO;
import com.jmmg.ms_security.DTOs.login.GoogleTokenDTO;
import com.jmmg.ms_security.services.SecurityService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;

@CrossOrigin
@RestController
@RequestMapping("/security")
public class SecurityController {

    @Autowired
    private SecurityService theSecurityService;

    @PostMapping("login")
    public ResponseEntity<TokenDTO> login(@RequestBody LoginDTO loginDTO) {
        String token = this.theSecurityService.login(loginDTO.toModel());
        if (token != null) {
            return ResponseEntity.ok(new TokenDTO(token));
        } else {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
    }

    @PostMapping("login/google")
    public ResponseEntity<TokenDTO> loginWithGoogle(@Valid @RequestBody GoogleTokenDTO googleTokenDTO) {
        try {
            String token = this.theSecurityService.loginWithGoogle(googleTokenDTO.idToken());
            if (token == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }
            return ResponseEntity.ok(new TokenDTO(token));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

    }
}
