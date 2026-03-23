package com.jmmg.ms_security.controllers;

import com.jmmg.ms_security.DTOs.GetSessionDTO;
import com.jmmg.ms_security.DTOs.PostSessionDTO;
import com.jmmg.ms_security.services.SessionService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin
@RestController
@RequestMapping("/sessions")
public class SessionController {

    @Autowired
    private SessionService sessionService;

    @GetMapping("")
    public ResponseEntity<List<GetSessionDTO>> find() {
        return ResponseEntity.ok(this.sessionService.find());
    }

    @GetMapping("{id}")
    public ResponseEntity<GetSessionDTO> findById(@PathVariable String id) {
        GetSessionDTO session = this.sessionService.findById(id);
        if (session != null) {
            return ResponseEntity.ok(session);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping
    public ResponseEntity<GetSessionDTO> create(@RequestBody PostSessionDTO newSession) {
        GetSessionDTO createdSession = this.sessionService.create(newSession);
        return ResponseEntity.status(201).body(createdSession);
    }

    @PutMapping("{id}")
    public ResponseEntity<GetSessionDTO> update(@PathVariable String id, @RequestBody PostSessionDTO newSession) {
        GetSessionDTO updatedSession = this.sessionService.update(id, newSession);
        if (updatedSession != null) {
            return ResponseEntity.ok(updatedSession);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("{id}")
    public ResponseEntity<GetSessionDTO> delete(@PathVariable String id) {
        this.sessionService.delete(id);
        return ResponseEntity.noContent().build();
    }

}