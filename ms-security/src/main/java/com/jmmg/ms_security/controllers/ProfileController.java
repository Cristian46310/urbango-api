package com.jmmg.ms_security.controllers;

import com.jmmg.ms_security.DTOs.GetProfileDTO;
import com.jmmg.ms_security.DTOs.PostProfileDTO;
import com.jmmg.ms_security.services.ProfileService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin
@RestController
@RequestMapping("/profiles")
public class ProfileController {

    @Autowired
    private ProfileService profileService;

    @GetMapping("")
    public ResponseEntity<List<GetProfileDTO>> find() {
        return ResponseEntity.ok(this.profileService.find());
    }

    @GetMapping("{id}")
    public ResponseEntity<GetProfileDTO> findById(@PathVariable String id) {
        GetProfileDTO profile = this.profileService.findById(id);
        if (profile != null) {
            return ResponseEntity.ok(profile);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping
    public ResponseEntity<GetProfileDTO> create(@RequestBody PostProfileDTO newProfile) {
        GetProfileDTO createdProfile = this.profileService.create(newProfile);
        return ResponseEntity.status(201).body(createdProfile);
    }

    @PutMapping("{id}")
    public ResponseEntity<GetProfileDTO> update(@PathVariable String id, @RequestBody PostProfileDTO newProfile) {
        GetProfileDTO updatedProfile = this.profileService.update(id, newProfile);
        if (updatedProfile != null) {
            return ResponseEntity.ok(updatedProfile);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("{id}")
    public ResponseEntity<GetProfileDTO> delete(@PathVariable String id) {
        this.profileService.delete(id);
        return ResponseEntity.noContent().build();
    }

}
