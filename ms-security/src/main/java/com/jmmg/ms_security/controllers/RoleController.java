package com.jmmg.ms_security.controllers;

import com.jmmg.ms_security.models.Role;
import com.jmmg.ms_security.services.RoleService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin
@RestController
@RequestMapping("/roles")
public class RoleController {

    @Autowired
    private RoleService roleService;

    @GetMapping("")
    public List<Role> find() {
        return this.roleService.find();
    }

    @GetMapping("{id}")
    public Role findById(@PathVariable String id) {
        return this.roleService.findById(id);
    }

    @PostMapping
    public Role create(@RequestBody Role newRole) {
        return this.roleService.create(newRole);
    }

    @PutMapping("{id}")
    public Role update(@PathVariable String id, @RequestBody Role newRole) {
        return this.roleService.update(id, newRole);
    }

    @DeleteMapping("{id}")
    public void delete(@PathVariable String id) {
        this.roleService.delete(id);
    }
}