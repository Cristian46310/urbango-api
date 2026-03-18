package com.jmmg.ms_security.controllers;

import java.util.List;
import java.util.Map;

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

import com.jmmg.ms_security.models.User;
import com.jmmg.ms_security.services.UserService;

@CrossOrigin
@RestController
@RequestMapping("/users")
public class UserController {
    @Autowired
    private UserService userService;

    @GetMapping("")
    public List<User> getAllUsers() {
        return userService.getAll();
    }

    @GetMapping("/{id}")
    public User getById(@PathVariable String id) {
        return userService.getById(id);
    }

    @PostMapping("")
    public User saveUser(@RequestBody User user) {
        return userService.save(user.getName(), user.getEmail(), user.getPassword());
    }

    @PutMapping("{id}")
    public User update(@PathVariable String id, @RequestBody User newUser) {
        return this.userService.update(id, newUser.getName(), newUser.getEmail(), newUser.getPassword());
    }

    @DeleteMapping("{id}")
    public void delete(@PathVariable String id) {
        this.userService.delete(id);
    }

    @PostMapping("{id}/profile/{profileID}")
    public ResponseEntity<Map<String, String>> addProfile(@PathVariable String id, @PathVariable String profileID) {
        boolean success = this.userService.addProfile(id, profileID);
        if (success) {
            return ResponseEntity.ok(Map.of("message", "Profile added successfully"));
        } else {
            return ResponseEntity.status(404).body(Map.of("message", "User or Profile not found"));
        }
    }

    @DeleteMapping("{id}/profile/{profileID}")
    public ResponseEntity<Map<String, String>> removeProfile(@PathVariable String id, @PathVariable String profileID) {
        boolean success = this.userService.removeProfile(id, profileID);
        if (success) {
            return ResponseEntity.ok(Map.of("message", "Profile removed successfully"));
        } else {
            return ResponseEntity.status(404).body(Map.of("message", "User or Profile not found"));
        }
    }

    @PostMapping("{id}/session/{sessionID}")
    public ResponseEntity<Map<String, String>> addSession(@PathVariable String id, @PathVariable String sessionID) {
        boolean success = this.userService.addSession(id, sessionID);
        if (success) {
            return ResponseEntity.ok(Map.of("message", "Session added successfully"));
        } else {
            return ResponseEntity.status(404).body(Map.of("message", "User or Session not found"));
        }
    }

    @DeleteMapping("{id}/session/{sessionID}")
    public ResponseEntity<Map<String, String>> removeSession(@PathVariable String id, @PathVariable String sessionID) {
        boolean success = this.userService.removeSession(id, sessionID);
        if (success) {
            return ResponseEntity.ok(Map.of("message", "Session removed successfully"));
        } else {
            return ResponseEntity.status(404).body(Map.of("message", "User or Session not found"));
        }
    }

}
