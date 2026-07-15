package com.jmmg.ms_security.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.jmmg.ms_security.DTOs.user.GetUserDTO;
import com.jmmg.ms_security.DTOs.user.GetUserListDTO;
import com.jmmg.ms_security.services.UserService;

/**
 * Service-to-service user directory (ms-messages). Requires X-Internal-Key.
 */
@CrossOrigin
@RestController
@RequestMapping("/api/internal/users")
public class InternalUserController {

    @Autowired
    private UserService userService;

    @GetMapping("")
    public ResponseEntity<Page<GetUserListDTO>> getAllUsers(
            @RequestParam(value = "q", required = false) String query,
            Pageable pageable) {
        if (query != null && !query.trim().isEmpty()) {
            return ResponseEntity.ok(userService.searchByNameOrEmail(query, pageable));
        }
        return ResponseEntity.ok(userService.getAll(pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<GetUserDTO> getById(@PathVariable String id) {
        GetUserDTO user = userService.getById(id);
        if (user != null) {
            return ResponseEntity.ok(user);
        }
        return ResponseEntity.notFound().build();
    }
}
