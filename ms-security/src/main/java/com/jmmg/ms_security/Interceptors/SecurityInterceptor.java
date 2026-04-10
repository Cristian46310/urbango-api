package com.jmmg.ms_security.Interceptors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.servlet.ModelAndView;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jmmg.ms_security.DTOs.ValidationErrorType;
import com.jmmg.ms_security.DTOs.ValidationResult;
import com.jmmg.ms_security.DTOs.errors.ErrorResponse;
import com.jmmg.ms_security.services.ValidatorService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class SecurityInterceptor implements HandlerInterceptor {
    @Autowired
    private ValidatorService validatorService;

    @Override
    public boolean preHandle(HttpServletRequest request,
            HttpServletResponse response,
            Object handler)
            throws Exception {
        ValidationResult validationResult = this.validatorService.validateRequest(request,
                request.getRequestURI(),
                request.getMethod()
        );

        if (!validationResult.isSuccess()) {
            sendErrorResponse(response, validationResult);
            return false;
        }
        return true;
    }

    private void sendErrorResponse(HttpServletResponse response, ValidationResult validationResult) throws Exception {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        
        // Diferenciamos entre 401 (autenticación) y 403 (autorización)
        int httpStatus = validationResult.getErrorType() == ValidationErrorType.FORBIDDEN 
            ? HttpServletResponse.SC_FORBIDDEN           // 403
            : HttpServletResponse.SC_UNAUTHORIZED;       // 401
        
        response.setStatus(httpStatus);
        
        ErrorResponse errorResponse = new ErrorResponse(
            validationResult.getMessage(),
            validationResult.getErrorType().name(),
            System.currentTimeMillis()
        );
        
        // Crear ObjectMapper localmente para evitar dependencia circular
        ObjectMapper objectMapper = new ObjectMapper();
        String jsonResponse = objectMapper.writeValueAsString(errorResponse);
        response.getWriter().write(jsonResponse);
    }

    @Override
    public void postHandle(HttpServletRequest request,
            HttpServletResponse response,
            Object handler,
            ModelAndView modelAndView) throws Exception {

    }

    @Override
    public void afterCompletion(HttpServletRequest request,
            HttpServletResponse response,
            Object handler,
            Exception ex) throws Exception {

    }
}
