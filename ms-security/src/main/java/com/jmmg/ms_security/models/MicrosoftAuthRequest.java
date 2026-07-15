package com.jmmg.ms_security.models;

import java.util.Date;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Temporal;
import jakarta.persistence.TemporalType;
import lombok.Data;

@Data
@Entity
@Table(name = "microsoft_auth_requests", schema = "security")
public class MicrosoftAuthRequest {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true)
    private String state;

    private String nonce;

    @Column(name = "code_verifier", columnDefinition = "text")
    private String codeVerifier;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private MicrosoftAuthMode mode;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private MicrosoftAuthRequestStatus status = MicrosoftAuthRequestStatus.PENDING;

    @Column(name = "user_id")
    private UUID userId;

    @Temporal(TemporalType.TIMESTAMP)
    private Date expiration;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "created_at", nullable = false)
    private Date createdAt = new Date();

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "updated_at", nullable = false)
    private Date updatedAt = new Date();

    @Column(name = "microsoft_user_id")
    private String microsoftUserId;

    @Column(name = "microsoft_name")
    private String microsoftName;

    @Column(name = "microsoft_email")
    private String microsoftEmail;

    @Column(name = "microsoft_phone", length = 64)
    private String microsoftPhone;

    @Column(name = "microsoft_photo_url", columnDefinition = "text")
    private String microsoftPhotoUrl;

    public String getIdAsString() {
        return id == null ? null : id.toString();
    }

    public void setIdFromString(String id) {
        this.id = id == null || id.isBlank() ? null : UUID.fromString(id);
    }

    public String getUserIdAsString() {
        return userId == null ? null : userId.toString();
    }

    public void setUserIdFromString(String userId) {
        this.userId = userId == null || userId.isBlank() ? null : UUID.fromString(userId);
    }
}
