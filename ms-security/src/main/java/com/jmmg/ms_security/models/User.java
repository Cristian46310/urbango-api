package com.jmmg.ms_security.models;

import java.time.Instant;
import java.util.UUID;

import com.jmmg.ms_security.DTOs.login.LoginDTO;
import com.jmmg.ms_security.DTOs.user.PostUserDTO;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;

@Data
@Entity
@Table(name = "users", schema = "security")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    @Column
    private String password;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    public User() {
    }

    public User(String name, String email, String password) {
        this.name = name;
        this.email = email;
        this.password = password;
    }

    public User(LoginDTO loginDTO) {
        this.email = loginDTO.email();
        this.password = loginDTO.password();
    }

    public User(PostUserDTO postUserDTO) {
        this.name = postUserDTO.name();
        this.email = postUserDTO.email();
        this.password = postUserDTO.password();
    }

    public void updateFromDTO(PostUserDTO postUserDTO) {
        this.name = postUserDTO.name();
        this.email = postUserDTO.email();
        if (postUserDTO.password() != null && !postUserDTO.password().isBlank()) {
            this.password = postUserDTO.password();
        }
    }

    /** ID como string para JWT/DTOs. */
    public String getIdAsString() {
        return id == null ? null : id.toString();
    }

    public void setIdFromString(String id) {
        this.id = id == null || id.isBlank() ? null : UUID.fromString(id);
    }
}
