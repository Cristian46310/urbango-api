package com.jmmg.ms_security.Interceptors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.servlet.HandlerInterceptor;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

public class SecurityInterceptor implements HandlerInterceptor {
    @Autowired
    private validatorService validatorService;
    @Override
    public boolean preHandle(HttpServletRequest request,
                             HttpServletResponse response,
                                Object handler) 
            throws Exception {
                boolean success=this.validatorService.validationRolePermission(request,request.getRequestURI(),request.getMethod());

                if(!success){
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    return false;
                }
                return true;
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
