package com.jmmg.ms_security.models;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;

@Data
@Entity
@Table(name = "github_auth_requests", schema = "security")
public class GitHubAuthRequest {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true)
    private String state;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private GitHubAuthMode mode;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private GitHubAuthRequestStatus status = GitHubAuthRequestStatus.PENDING;

    @Column(name = "user_id")
    private UUID userId;

    private Instant expiration;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    @Column(name = "github_user_id")
    private Long githubUserId;

    @Column(name = "github_username")
    private String githubUsername;

    @Column(name = "github_name")
    private String githubName;

    @Column(name = "github_email")
    private String githubEmail;

    @Column(name = "github_avatar_url", columnDefinition = "text")
    private String githubAvatarUrl;

    @Column(name = "github_profile_url", columnDefinition = "text")
    private String githubProfileUrl;

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
