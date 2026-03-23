package com.jmmg.ms_security.controllers;

import com.jmmg.ms_security.DTOs.LoginDTO;
import com.jmmg.ms_security.DTOs.TokenDTO;
import com.jmmg.ms_security.services.SecurityService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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
}
