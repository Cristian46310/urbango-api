package com.jmmg.ms_security.models;

import java.util.Date;
import java.util.UUID;

import com.jmmg.ms_security.DTOs.Session.GetSessionDTO;
import com.jmmg.ms_security.DTOs.Session.PostSessionDTO;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Temporal;
import jakarta.persistence.TemporalType;
import lombok.Data;

@Data
@Entity
@Table(name = "sessions", schema = "security")
public class Session {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, columnDefinition = "text")
    private String token;

    @Temporal(TemporalType.TIMESTAMP)
    private Date expiration;

    @Column(name = "code_2fa", length = 64)
    private String code2FA;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "created_at", nullable = false)
    private Date createdAt = new Date();

    public Session() {
    }

    public Session(String token, Date expiration, String code2FA) {
        this.token = token;
        this.expiration = expiration;
        this.code2FA = code2FA;
    }

    public Session(GetSessionDTO getSessionDTO) {
        this.setIdFromString(getSessionDTO.id());
        this.token = getSessionDTO.token();
        this.expiration = getSessionDTO.expiration();
        this.code2FA = getSessionDTO.code2FA();
        if (getSessionDTO.userId() != null) {
            User user = new User();
            user.setIdFromString(getSessionDTO.userId());
            this.user = user;
        }
    }

    public Session(PostSessionDTO postSessionDTO) {
        this.token = postSessionDTO.token();
        this.expiration = postSessionDTO.expiration();
        this.code2FA = postSessionDTO.code2FA();
        if (postSessionDTO.userId() != null) {
            User user = new User();
            user.setIdFromString(postSessionDTO.userId());
            this.user = user;
        }
    }

    public void updateFromDTO(PostSessionDTO postSessionDTO) {
        this.token = postSessionDTO.token();
        this.expiration = postSessionDTO.expiration();
        this.code2FA = postSessionDTO.code2FA();
        if (postSessionDTO.userId() != null) {
            User user = new User();
            user.setIdFromString(postSessionDTO.userId());
            this.user = user;
        }
    }

    public String getIdAsString() {
        return id == null ? null : id.toString();
    }

    public void setIdFromString(String id) {
        this.id = id == null || id.isBlank() ? null : UUID.fromString(id);
    }
}
