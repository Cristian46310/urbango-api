package com.jmmg.ms_security.controllers;

import java.net.URI;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.jmmg.ms_security.DTOs.login.CompleteMicrosoftRegistrationDTO;
import com.jmmg.ms_security.DTOs.login.MicrosoftAuthResultDTO;
import com.jmmg.ms_security.DTOs.login.MicrosoftAuthorizeDTO;
import com.jmmg.ms_security.DTOs.login.MicrosoftCallbackDTO;
import com.jmmg.ms_security.DTOs.message.ResponseMessage;
import com.jmmg.ms_security.infra.exception.NotPermitted;
import com.jmmg.ms_security.models.MicrosoftAuthMode;
import com.jmmg.ms_security.models.User;
import com.jmmg.ms_security.services.AuthenticatedUserService;
import com.jmmg.ms_security.services.MicrosoftOAuthService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

@CrossOrigin
@RestController
@RequestMapping("/api/public/security/microsoft")
public class MicrosoftAuthController {

    @Autowired
    private MicrosoftOAuthService microsoftOAuthService;

    @Autowired
    private AuthenticatedUserService authenticatedUserService;

    @GetMapping("authorize")
    public ResponseEntity<Void> authorize() {
        MicrosoftAuthorizeDTO authorizeDTO = this.microsoftOAuthService.createAuthorization(MicrosoftAuthMode.LOGIN, null);
        HttpHeaders headers = new HttpHeaders();
        headers.setLocation(URI.create(authorizeDTO.authorizationUrl()));
        return new ResponseEntity<>(headers, HttpStatus.FOUND);
    }

    @PostMapping("authorize")
    public ResponseEntity<MicrosoftAuthorizeDTO> authorizePost() {
        return ResponseEntity.ok(this.microsoftOAuthService.createAuthorization(MicrosoftAuthMode.LOGIN, null));
    }

    @GetMapping("link/authorize")
    public ResponseEntity<Void> authorizeLink(HttpServletRequest request) {
        User user = this.authenticatedUserService.getAuthenticatedUser(request);
        if (user == null) {
            throw new NotPermitted("Authentication is required to link a Microsoft account.");
        }

        MicrosoftAuthorizeDTO authorizeDTO = this.microsoftOAuthService.createAuthorization(MicrosoftAuthMode.LINK, user.getId());
        HttpHeaders headers = new HttpHeaders();
        headers.setLocation(URI.create(authorizeDTO.authorizationUrl()));
        return new ResponseEntity<>(headers, HttpStatus.FOUND);
    }

    @PostMapping("link/authorize")
    public ResponseEntity<MicrosoftAuthorizeDTO> authorizeLinkPost(HttpServletRequest request) {
        User user = this.authenticatedUserService.getAuthenticatedUser(request);
        if (user == null) {
            throw new NotPermitted("Authentication is required to link a Microsoft account.");
        }

        return ResponseEntity.ok(this.microsoftOAuthService.createAuthorization(MicrosoftAuthMode.LINK, user.getId()));
    }

    @GetMapping("callback")
    public ResponseEntity<MicrosoftAuthResultDTO> callback(
            @RequestParam String code,
            @RequestParam String state) {
        return ResponseEntity.ok(this.microsoftOAuthService.handleCallback(code, state));
    }

    @PostMapping("callback")
    public ResponseEntity<MicrosoftAuthResultDTO> callbackPost(
            @Valid @RequestBody MicrosoftCallbackDTO microsoftCallbackDTO) {
        return ResponseEntity.ok(this.microsoftOAuthService.handleCallback(
                microsoftCallbackDTO.code(),
                microsoftCallbackDTO.state()));
    }

    @PostMapping("complete-registration")
    public ResponseEntity<MicrosoftAuthResultDTO> completeRegistration(
            @Valid @RequestBody CompleteMicrosoftRegistrationDTO completeMicrosoftRegistrationDTO) {
        return ResponseEntity.ok(
                this.microsoftOAuthService.completeRegistration(
                        completeMicrosoftRegistrationDTO.registrationToken(),
                        completeMicrosoftRegistrationDTO.email()));
    }

    @DeleteMapping("link")
    public ResponseEntity<ResponseMessage> unlink(HttpServletRequest request) {
        User user = this.authenticatedUserService.getAuthenticatedUser(request);
        if (user == null) {
            throw new NotPermitted("Authentication is required to unlink a Microsoft account.");
        }

        this.microsoftOAuthService.unlink(user.getId());
        return ResponseEntity.ok(new ResponseMessage("Microsoft account unlinked successfully"));
    }
}
