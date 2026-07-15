package com.jmmg.ms_security.models;

import java.util.UUID;

import com.jmmg.ms_security.DTOs.Profile.GetProfileDTO;
import com.jmmg.ms_security.DTOs.Profile.PostProfileDTO;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Data;

@Data
@Entity
@Table(name = "profiles", schema = "security")
public class Profile {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(length = 64)
    private String phone;

    @Column(columnDefinition = "text")
    private String photo;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    public Profile() {
    }

    public Profile(String phone, String photo) {
        this.phone = phone;
        this.photo = photo;
    }

    public Profile(GetProfileDTO getProfileDTO) {
        this.setIdFromString(getProfileDTO.id());
        this.phone = getProfileDTO.phone();
        this.photo = getProfileDTO.photo();
        if (getProfileDTO.userId() != null) {
            User user = new User();
            user.setIdFromString(getProfileDTO.userId());
            this.user = user;
        }
    }

    public Profile(PostProfileDTO postProfileDTO) {
        this.phone = postProfileDTO.phone();
        this.photo = postProfileDTO.photo();
    }

    public void updateFromDTO(PostProfileDTO postProfileDTO) {
        this.phone = postProfileDTO.phone();
        this.photo = postProfileDTO.photo();
    }

    public String getIdAsString() {
        return id == null ? null : id.toString();
    }

    public void setIdFromString(String id) {
        this.id = id == null || id.isBlank() ? null : UUID.fromString(id);
    }
}
