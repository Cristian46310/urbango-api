package com.jmmg.ms_security.controllers;

import java.util.List;
import java.util.stream.Collectors;

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

import com.jmmg.ms_security.DTOs.ResponseMessage;
import com.jmmg.ms_security.DTOs.GetUserDTO;
import com.jmmg.ms_security.services.UserService;

@CrossOrigin
@RestController
@RequestMapping("/users")
public class UserController {
    @Autowired
    private UserService userService;

    @GetMapping("")
    public List<GetUserDTO> getAllUsers() {
        return userService.getAll().stream().map(GetUserDTO::fromModel).collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<GetUserDTO> getById(@PathVariable String id) {
        GetUserDTO user = GetUserDTO.fromModel(userService.getById(id));
        if (user != null) {
            return ResponseEntity.ok(user);
        }
        return ResponseEntity.notFound().build();
    }

    @PostMapping("")
    public ResponseEntity<GetUserDTO> saveUser(@RequestBody GetUserDTO user) {
        return ResponseEntity.status(201)
                .body(GetUserDTO.fromModel(userService.save(user.name(), user.email(), user.password())));
    }

    @PutMapping("{id}")
    public ResponseEntity<GetUserDTO> update(@PathVariable String id, @RequestBody GetUserDTO newUser) {
        GetUserDTO updated = GetUserDTO.fromModel(this.userService.update(id, newUser.name(), newUser.email(), newUser.password()));
        if (updated != null) {
            return ResponseEntity.ok(updated);
        }
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping("{id}")
    public void delete(@PathVariable String id) {
        this.userService.delete(id);
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
    public ResponseEntity<ResponseMessage> removeProfile(@PathVariable String id, @PathVariable String profileID) {
        boolean success = this.userService.removeProfile(id, profileID);
        if (success) {
            return ResponseEntity.noContent().build();
        } else {
            return ResponseEntity.status(404).body(new ResponseMessage("User or Profile not found"));
        }
    }

    @PostMapping("{id}/session/{sessionID}")
    public ResponseEntity<ResponseMessage> addSession(@PathVariable String id, @PathVariable String sessionID) {
        boolean success = this.userService.addSession(id, sessionID);
        if (success) {
            return ResponseEntity.ok(new ResponseMessage("Session added successfully"));
        } else {
            return ResponseEntity.status(404).body(new ResponseMessage("User or Session not found"));
        }
    }

    @DeleteMapping("{id}/session/{sessionID}")
    public ResponseEntity<ResponseMessage> removeSession(@PathVariable String id, @PathVariable String sessionID) {
        boolean success = this.userService.removeSession(id, sessionID);
        if (success) {
            return ResponseEntity.noContent().build();
        } else {
            return ResponseEntity.status(404).body(new ResponseMessage("User or Session not found"));
        }
    }

}
