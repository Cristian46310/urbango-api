package com.jmmg.ms_security.models;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;

@Data
@Entity
@Table(name = "github_accounts", schema = "security")
public class GitHubAccount {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false, unique = true)
    private UUID userId;

    @Column(name = "provider_user_id", nullable = false, unique = true)
    private Long providerUserId;

    private String username;

    @Column(name = "display_name")
    private String displayName;

    private String email;

    @Column(name = "avatar_url", columnDefinition = "text")
    private String avatarUrl;

    @Column(name = "profile_url", columnDefinition = "text")
    private String profileUrl;

    @Column(name = "linked_at")
    private Instant linkedAt;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

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
