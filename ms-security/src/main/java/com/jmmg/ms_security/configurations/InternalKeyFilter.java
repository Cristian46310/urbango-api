package com.jmmg.ms_security.configurations;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

import org.springframework.http.MediaType;
import org.springframework.web.filter.OncePerRequestFilter;

import com.jmmg.ms_security.infra.config.InternalKeyProperties;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Protects /api/internal/** with shared secret header X-Internal-Key.
 */
public class InternalKeyFilter extends OncePerRequestFilter {

    public static final String HEADER_NAME = "X-Internal-Key";

    private final InternalKeyProperties internalKeyProperties;

    public InternalKeyFilter(InternalKeyProperties internalKeyProperties) {
        this.internalKeyProperties = internalKeyProperties;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return path == null || !path.startsWith("/api/internal/");
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        String configured = this.internalKeyProperties.getKey();
        if (configured == null || configured.isBlank()) {
            response.setStatus(HttpServletResponse.SC_SERVICE_UNAVAILABLE);
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.getWriter().write(
                    "{\"message\":\"MS_SECURITY_INTERNAL_KEY is not configured\"}");
            return;
        }

        String provided = request.getHeader(HEADER_NAME);
        if (provided == null || provided.isBlank() || !constantTimeEquals(configured, provided)) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.getWriter().write("{\"message\":\"Invalid or missing X-Internal-Key\"}");
            return;
        }

        filterChain.doFilter(request, response);
    }

    private static boolean constantTimeEquals(String expected, String actual) {
        byte[] a = expected.getBytes(StandardCharsets.UTF_8);
        byte[] b = actual.getBytes(StandardCharsets.UTF_8);
        if (a.length != b.length) {
            return MessageDigest.isEqual(a, a) && false;
        }
        return MessageDigest.isEqual(a, b);
    }
}
