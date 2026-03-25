package com.jmmg.ms_security.infra.security;

import java.io.IOException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.jmmg.ms_security.models.User;
import com.jmmg.ms_security.repositories.IUserRepository;
import com.jmmg.ms_security.services.CustomUserDetailsService;
import com.jmmg.ms_security.services.JwtService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.userdetails.UserDetails;

@Component
public class SecurityFilter extends OncePerRequestFilter {

    @Autowired
    private JwtService jwtService;

    @Autowired
    private IUserRepository userRepository;
    
    @Autowired
    private CustomUserDetailsService customUserDetailsService;

    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws IOException, ServletException {
        var authorizationHeader = request.getHeader("Authorization");
        if (authorizationHeader != null && authorizationHeader.startsWith("Bearer ")) {
            var token = authorizationHeader.replace("Bearer ", "");
            try {
                if (!jwtService.validateToken(token)) {
                    sendErrorResponse(response, HttpStatus.UNAUTHORIZED, "Token inválido o expirado");
                    return;
                }
                User userJWT = jwtService.getUserFromToken(token);
                UserDetails userDetails = customUserDetailsService.loadUserByUsername(userJWT.getEmail());
                if (userDetails != null) {
                    var authentication = new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                } else {
                    sendErrorResponse(response, HttpStatus.NOT_FOUND, "User not found");
                    return;
                }
            } catch (RuntimeException e) {
                sendErrorResponse(response, HttpStatus.UNAUTHORIZED, e.getMessage());
                return;
            }
        }
        filterChain.doFilter(request, response);
    }

    private void sendErrorResponse(HttpServletResponse response, HttpStatus status, String message) throws IOException {
        response.setStatus(status.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.getWriter().write("{\"message\":\"" + message + "\",\"status\":\"" + status.value() + "\"}");
    }

}
