package com.jmmg.ms_security.controllers;

import com.jmmg.ms_security.DTOs.permission.GetPermissionDTO;
import com.jmmg.ms_security.DTOs.permission.PostPermissionDTO;
import com.jmmg.ms_security.services.PermissionService;

import jakarta.validation.Valid;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.net.URI;
import java.util.List;

@CrossOrigin
@RestController
@RequestMapping("/api/permissions")
public class PermissionController {

    @Autowired
    private PermissionService permissionService;

    @GetMapping("")
    public ResponseEntity<List<GetPermissionDTO>> find() {
        return ResponseEntity.ok(this.permissionService.find());
    }

    @GetMapping("{id}")
    public ResponseEntity<GetPermissionDTO> findById(@PathVariable String id) {
        GetPermissionDTO permission = this.permissionService.findById(id);
        if (permission != null) {
            return ResponseEntity.ok(permission);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping
    public ResponseEntity<GetPermissionDTO> create(@Valid @RequestBody PostPermissionDTO newPermission) {
        GetPermissionDTO createdPermission = this.permissionService.create(newPermission);
        return ResponseEntity.created(URI.create("/permissions/" + createdPermission.id())).body(createdPermission);
    }

    @PutMapping("{id}")
    public ResponseEntity<GetPermissionDTO> update(@PathVariable String id, @Valid @RequestBody PostPermissionDTO newPermission) {
        GetPermissionDTO updatedPermission = this.permissionService.update(id, newPermission);
        if (updatedPermission != null) {
            return ResponseEntity.ok(updatedPermission);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        this.permissionService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
