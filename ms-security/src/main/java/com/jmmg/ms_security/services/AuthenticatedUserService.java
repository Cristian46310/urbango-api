package com.jmmg.ms_security.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.jmmg.ms_security.models.User;
import com.jmmg.ms_security.repositories.IUserRepository;

import jakarta.servlet.http.HttpServletRequest;

@Service
public class AuthenticatedUserService {

    private static final String BEARER = "Bearer ";

    @Autowired
    private JwtService jwtService;

    @Autowired
    private IUserRepository userRepository;

    public User getAuthenticatedUser(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith(BEARER)) {
            return null;
        }

        String token = authHeader.substring(BEARER.length());
        User user = this.jwtService.getUserFromToken(token);
        if (user == null || user.getId() == null) {
            return null;
        }

        return this.userRepository.findById(user.getId()).orElse(null);
    }
}
