package com.jmmg.ms_security.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.jmmg.ms_security.DTOs.message.ResponseMessage;
import com.jmmg.ms_security.services.UserRoleService;

/**
 * Service-to-service role assignment (ms-business). Requires X-Internal-Key.
 */
@CrossOrigin
@RestController
@RequestMapping("/api/internal/user-role")
public class InternalUserRoleController {

    @Autowired
    private UserRoleService userRoleService;

    @PostMapping("user/{userId}/role-name/{roleName}")
    public ResponseEntity<ResponseMessage> addUserRoleByName(
            @PathVariable String userId,
            @PathVariable String roleName) {

        boolean response = this.userRoleService.addUserRoleByName(userId, roleName);
        if (response) {
            return ResponseEntity.ok(new ResponseMessage("Success"));
        }
        return ResponseEntity.notFound().build();
    }
}
