package com.jmmg.ms_security.controllers;

import com.jmmg.ms_security.DTOs.Profile.GetProfileDTO;
import com.jmmg.ms_security.DTOs.Profile.PostProfileDTO;
import com.jmmg.ms_security.services.ProfileService;

import jakarta.validation.Valid;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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

@CrossOrigin
@RestController
@RequestMapping("/api/profiles")
public class ProfileController {

    @Autowired
    private ProfileService profileService;

    @GetMapping("")
    public ResponseEntity<Page<GetProfileDTO>> find(Pageable pageable) {
        return ResponseEntity.ok(this.profileService.find(pageable));
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
    public ResponseEntity<GetProfileDTO> create(@Valid @RequestBody PostProfileDTO newProfile) {
        GetProfileDTO createdProfile = this.profileService.create(newProfile);
        return ResponseEntity.created(URI.create("/profiles/" + createdProfile.id())).body(createdProfile);
    }

    @PutMapping("{id}")
    public ResponseEntity<GetProfileDTO> update(@PathVariable String id, @Valid @RequestBody PostProfileDTO newProfile) {
        GetProfileDTO updatedProfile = this.profileService.update(id, newProfile);
        if (updatedProfile != null) {
            return ResponseEntity.ok(updatedProfile);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        this.profileService.delete(id);
        return ResponseEntity.noContent().build();
    }

}
