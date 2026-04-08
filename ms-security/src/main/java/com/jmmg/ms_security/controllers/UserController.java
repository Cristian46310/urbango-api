package com.jmmg.ms_security.controllers;

import java.net.URI;
import java.util.List;

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

import com.jmmg.ms_security.DTOs.message.ResponseMessage;
import com.jmmg.ms_security.DTOs.user.GetUserDTO;
import com.jmmg.ms_security.DTOs.user.PostUserDTO;
import com.jmmg.ms_security.services.UserService;

import jakarta.validation.Valid;

@CrossOrigin
@RestController
@RequestMapping("/api/public/users")
public class UserController {
    @Autowired
    private UserService userService;

    @GetMapping("")
    public ResponseEntity<List<GetUserDTO>> getAllUsers() {
        return ResponseEntity.ok(userService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<GetUserDTO> getById(@PathVariable String id) {
        GetUserDTO user = userService.getById(id);
        if (user != null) {
            return ResponseEntity.ok(user);
        }
        return ResponseEntity.notFound().build();
    }

    @PostMapping("")
    public ResponseEntity<GetUserDTO> createUser(@Valid @RequestBody PostUserDTO user) {
        GetUserDTO createdUser = userService.create(user);
        return ResponseEntity.created(URI.create("/users/" + createdUser.id())).body(createdUser);
    }

    @PutMapping("{id}")
    public ResponseEntity<GetUserDTO> update(@PathVariable String id, @Valid @RequestBody PostUserDTO newUser) {
        GetUserDTO updated = this.userService.update(id, newUser);
        if (updated != null) {
            return ResponseEntity.ok(updated);
        }
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping("{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        this.userService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("{id}/profile/{profileID}")
    public ResponseEntity<ResponseMessage> addProfile(@PathVariable String id, @PathVariable String profileID) {
        boolean success = this.userService.addProfile(id, profileID);
        if (success) {
            return ResponseEntity.ok(new ResponseMessage("Profile added successfully"));
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("{id}/profile/{profileID}")
    public ResponseEntity<Void> removeProfile(@PathVariable String id, @PathVariable String profileID) {
        boolean success = this.userService.removeProfile(id, profileID);
        if (success) {
            return ResponseEntity.noContent().build();
        } else {
            return ResponseEntity.notFound().build();
        }
    }

}
