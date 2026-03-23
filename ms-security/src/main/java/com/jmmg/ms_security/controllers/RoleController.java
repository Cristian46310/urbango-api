package com.jmmg.ms_security.controllers;

import com.jmmg.ms_security.DTOs.GetRoleDTO;
import com.jmmg.ms_security.DTOs.PostRoleDTO;
import com.jmmg.ms_security.services.RoleService;

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
@RequestMapping("/roles")
public class RoleController {

    @Autowired
    private RoleService roleService;

    @GetMapping("")
    public ResponseEntity<List<GetRoleDTO>> find() {
        return ResponseEntity.ok(this.roleService.find());
    }

    @GetMapping("{id}")
    public ResponseEntity<GetRoleDTO> findById(@PathVariable String id) {
        GetRoleDTO role = this.roleService.findById(id);
        if (role != null) {
            return ResponseEntity.ok(role);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping
    public ResponseEntity<GetRoleDTO> create(@RequestBody PostRoleDTO newRole) {
        GetRoleDTO createdRole = this.roleService.create(newRole);
        return ResponseEntity.created(URI.create("/roles/" + createdRole.id())).body(createdRole);
    }

    @PutMapping("{id}")
    public ResponseEntity<GetRoleDTO> update(@PathVariable String id, @RequestBody PostRoleDTO newRole) {
        GetRoleDTO updatedRole = this.roleService.update(id, newRole);
        if (updatedRole != null) {
            return ResponseEntity.ok(updatedRole);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        this.roleService.delete(id);
        return ResponseEntity.noContent().build();
    }
}