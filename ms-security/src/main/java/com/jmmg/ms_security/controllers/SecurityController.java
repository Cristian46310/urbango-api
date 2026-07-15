package com.jmmg.ms_security.controllers;

import com.jmmg.ms_security.DTOs.login.LoginChallengeDTO;
import com.jmmg.ms_security.DTOs.login.LoginDTO;
import com.jmmg.ms_security.DTOs.login.TokenDTO;
import com.jmmg.ms_security.DTOs.login.CompleteGitHubRegistrationDTO;
import com.jmmg.ms_security.DTOs.login.GitHubAuthResultDTO;
import com.jmmg.ms_security.DTOs.login.GitHubAuthorizeDTO;
import com.jmmg.ms_security.DTOs.login.GitHubCallbackDTO;
import com.jmmg.ms_security.DTOs.login.GoogleTokenDTO;
import com.jmmg.ms_security.DTOs.login.RegisterUserDTO;
import com.jmmg.ms_security.DTOs.auth.ValidateTokenResponseDTO;
import com.jmmg.ms_security.DTOs.user.GetUserDetailDTO;
import com.jmmg.ms_security.DTOs.login.Verify2FADTO;
import com.jmmg.ms_security.models.GitHubAuthMode;
import com.jmmg.ms_security.services.GitHubOAuthService;
import com.jmmg.ms_security.services.SecurityService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.jmmg.ms_security.DTOs.message.ResponseMessage;
import com.jmmg.ms_security.DTOs.password.ForgotPasswordDTO;
import com.jmmg.ms_security.DTOs.password.ResetPasswordDTO;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

@CrossOrigin
@RestController
@RequestMapping("/api/public/security")
public class SecurityController {

    @Autowired
    private SecurityService theSecurityService;

    @Autowired
    private GitHubOAuthService gitHubOAuthService;

    @PostMapping("login")
    public ResponseEntity<LoginChallengeDTO> login(@Valid @RequestBody LoginDTO loginDTO) {
        return this.theSecurityService.login(loginDTO)
                .map(ResponseEntity::ok)
                .defaultIfEmpty(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build())
                .block();
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

    @PostMapping("login/github/authorize")
    public ResponseEntity<GitHubAuthorizeDTO> authorizeGitHubLogin() {
        return ResponseEntity.ok(this.gitHubOAuthService.createAuthorization(GitHubAuthMode.LOGIN, null));
    }

    @PostMapping("login/github")
    public ResponseEntity<GitHubAuthResultDTO> loginWithGitHub(@Valid @RequestBody GitHubCallbackDTO gitHubCallbackDTO) {
        return ResponseEntity.ok(this.gitHubOAuthService.handleCallback(
                gitHubCallbackDTO.code(),
                gitHubCallbackDTO.state()));
    }

    @PostMapping("login/github/complete")
    public ResponseEntity<GitHubAuthResultDTO> completeGitHubLogin(
            @Valid @RequestBody CompleteGitHubRegistrationDTO completeGitHubRegistrationDTO) {
        return ResponseEntity.ok(this.gitHubOAuthService.completeRegistration(
                completeGitHubRegistrationDTO.registrationToken(),
                completeGitHubRegistrationDTO.email()));
    }

    @PostMapping("verify-2fa")
    public ResponseEntity<TokenDTO> verifyTwoFactor(@Valid @RequestBody Verify2FADTO verify2FADTO) {
        String token = this.theSecurityService.verifyTwoFactor(verify2FADTO);
        if (token != null) {
            return ResponseEntity.ok(new TokenDTO(token));
        }
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }

    @PostMapping("register")
    public ResponseEntity<ResponseMessage> register(@Valid @RequestBody RegisterUserDTO registerUserDTO) {
        String message = this.theSecurityService.register(registerUserDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(new ResponseMessage(message));
    }

         @PostMapping("forgot-password")
    public ResponseEntity<ResponseMessage> forgotPassword(@Valid @RequestBody ForgotPasswordDTO dto) {
        String message = this.theSecurityService.forgotPassword(dto);
        return ResponseEntity.ok(new ResponseMessage(message));
    }

    @PostMapping("reset-password")
    public ResponseEntity<ResponseMessage> resetPassword(@Valid @RequestBody ResetPasswordDTO dto) {
        boolean success = this.theSecurityService.resetPassword(dto);
        if (success) {
            return ResponseEntity.ok(new ResponseMessage("Contraseña actualizada exitosamente"));
        }
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ResponseMessage("El token es inválido o ha expirado"));
    }

    @GetMapping("me")
    public ResponseEntity<GetUserDetailDTO> me(HttpServletRequest request) {
        GetUserDetailDTO me = this.theSecurityService.me(request);
        if (me == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(me);
    }

    @PostMapping("validate-token")
    public ResponseEntity<ValidateTokenResponseDTO> validateToken(HttpServletRequest request) {
        ValidateTokenResponseDTO payload = this.theSecurityService.validateToken(request);
        if (payload == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(payload);
    }

    @PostMapping("refresh-token")
    public ResponseEntity<TokenDTO> refreshToken(HttpServletRequest request) {
        String token = this.theSecurityService.refreshToken(request);
        if (token == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(new TokenDTO(token));
    }
}
