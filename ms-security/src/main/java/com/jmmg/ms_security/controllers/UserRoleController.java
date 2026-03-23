package com.jmmg.ms_security.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.jmmg.ms_security.DTOs.ResponseMessage;
import com.jmmg.ms_security.services.UserRoleService;

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

