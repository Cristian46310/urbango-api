package com.jmmg.ms_security.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import org.springframework.web.bind.annotation.RequestBody;

import com.jmmg.ms_security.DTOs.Role.AssignRolesDTO;
import com.jmmg.ms_security.DTOs.message.ResponseMessage;
import com.jmmg.ms_security.services.UserRoleService;

import jakarta.validation.Valid;

@CrossOrigin
@RestController
@RequestMapping("/user-role")
public class UserRoleController {
    @Autowired
    private UserRoleService userRoleService;

    @PostMapping("user/{userId}/role/{roleId}")
    public ResponseEntity<ResponseMessage> addUserRole(
            @PathVariable String userId,
            @PathVariable String roleId) {

        boolean response = this.userRoleService.addUserRole(userId, roleId);
        if (response) {
            return ResponseEntity.ok(new ResponseMessage("Success"));
        } else {
            return ResponseEntity.notFound().build();
        }
    }
    @DeleteMapping("{userRoleId}")
    public ResponseEntity<Void> removeUserRole(
            @PathVariable String userRoleId) {

        boolean response = this.userRoleService.removeUserRole(userRoleId);
        if (response) {
            return ResponseEntity.noContent().build();
        } else {
            return ResponseEntity.notFound().build();
        }
    }
}

