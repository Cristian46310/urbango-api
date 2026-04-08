package com.jmmg.ms_security.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.jmmg.ms_security.DTOs.message.ResponseMessage;
import com.jmmg.ms_security.services.RolePermissionService;

@CrossOrigin
@RestController
@RequestMapping("/api/role-permission")
public class RolePermissionController {
    @Autowired
    private RolePermissionService rolePermissionService;

    @PostMapping("role/{roleId}/permission/{permissionId}")
    public ResponseEntity<ResponseMessage> addRolePermission(
            @PathVariable String roleId,
            @PathVariable String permissionId) {

        boolean response = this.rolePermissionService.addRolePermission(roleId, permissionId);
        if (response) {
            return ResponseEntity.ok(new ResponseMessage("Success"));
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("{rolePermissionId}")
    public ResponseEntity<Void> removeRolePermission(
            @PathVariable String rolePermissionId) {

        boolean response = this.rolePermissionService.removeRolePermission(rolePermissionId);
        if (response) {
            return ResponseEntity.noContent().build();
        } else {
            return ResponseEntity.notFound().build();
        }
    }
}
