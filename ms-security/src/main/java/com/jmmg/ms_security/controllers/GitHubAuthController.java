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

import com.jmmg.ms_security.DTOs.login.CompleteGitHubRegistrationDTO;
import com.jmmg.ms_security.DTOs.login.GitHubCallbackDTO;
import com.jmmg.ms_security.DTOs.login.GitHubAuthResultDTO;
import com.jmmg.ms_security.DTOs.login.GitHubAuthorizeDTO;
import com.jmmg.ms_security.DTOs.message.ResponseMessage;
import com.jmmg.ms_security.infra.exception.NotPermitted;
import com.jmmg.ms_security.models.GitHubAuthMode;
import com.jmmg.ms_security.models.User;
import com.jmmg.ms_security.services.AuthenticatedUserService;
import com.jmmg.ms_security.services.GitHubOAuthService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

@CrossOrigin
@RestController
@RequestMapping("/api/public/security/github")
public class GitHubAuthController {

    @Autowired
    private GitHubOAuthService gitHubOAuthService;

    @Autowired
    private AuthenticatedUserService authenticatedUserService;

    @GetMapping("authorize")
    public ResponseEntity<Void> authorize() {
        GitHubAuthorizeDTO authorizeDTO = this.gitHubOAuthService.createAuthorization(GitHubAuthMode.LOGIN, null);
        HttpHeaders headers = new HttpHeaders();
        headers.setLocation(URI.create(authorizeDTO.authorizationUrl()));
        return new ResponseEntity<>(headers, HttpStatus.FOUND);
    }

    @PostMapping("authorize")
    public ResponseEntity<GitHubAuthorizeDTO> authorizePost() {
        return ResponseEntity.ok(this.gitHubOAuthService.createAuthorization(GitHubAuthMode.LOGIN, null));
    }

    @GetMapping("link/authorize")
    public ResponseEntity<Void> authorizeLink(HttpServletRequest request) {
        User user = this.authenticatedUserService.getAuthenticatedUser(request);
        if (user == null) {
            throw new NotPermitted("Authentication is required to link a GitHub account.");
        }

        GitHubAuthorizeDTO authorizeDTO = this.gitHubOAuthService.createAuthorization(GitHubAuthMode.LINK, user.getId());
        HttpHeaders headers = new HttpHeaders();
        headers.setLocation(URI.create(authorizeDTO.authorizationUrl()));
        return new ResponseEntity<>(headers, HttpStatus.FOUND);
    }

    @PostMapping("link/authorize")
    public ResponseEntity<GitHubAuthorizeDTO> authorizeLinkPost(HttpServletRequest request) {
        User user = this.authenticatedUserService.getAuthenticatedUser(request);
        if (user == null) {
            throw new NotPermitted("Authentication is required to link a GitHub account.");
        }

        return ResponseEntity.ok(this.gitHubOAuthService.createAuthorization(GitHubAuthMode.LINK, user.getId()));
    }

    @GetMapping("callback")
    public ResponseEntity<GitHubAuthResultDTO> callback(
            @RequestParam String code,
            @RequestParam String state) {
        return ResponseEntity.ok(this.gitHubOAuthService.handleCallback(code, state));
    }

    @PostMapping("callback")
    public ResponseEntity<GitHubAuthResultDTO> callbackPost(
            @Valid @RequestBody GitHubCallbackDTO gitHubCallbackDTO) {
        return ResponseEntity.ok(this.gitHubOAuthService.handleCallback(
                gitHubCallbackDTO.code(),
                gitHubCallbackDTO.state()));
    }

    @PostMapping("complete-registration")
    public ResponseEntity<GitHubAuthResultDTO> completeRegistration(
            @Valid @RequestBody CompleteGitHubRegistrationDTO completeGitHubRegistrationDTO) {
        return ResponseEntity.ok(
                this.gitHubOAuthService.completeRegistration(
                        completeGitHubRegistrationDTO.registrationToken(),
                        completeGitHubRegistrationDTO.email()));
    }

    @DeleteMapping("link")
    public ResponseEntity<ResponseMessage> unlink(HttpServletRequest request) {
        User user = this.authenticatedUserService.getAuthenticatedUser(request);
        if (user == null) {
            throw new NotPermitted("Authentication is required to unlink a GitHub account.");
        }

        this.gitHubOAuthService.unlink(user.getId());
        return ResponseEntity.ok(new ResponseMessage("GitHub account unlinked successfully"));
    }
}
