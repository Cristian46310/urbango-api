package com.jmmg.ms_security.models;

import java.util.Date;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.Data;

@Data
@Document
@CompoundIndex(name = "github_auth_state_unique_idx", def = "{'state': 1}", unique = true)
public class GitHubAuthRequest {
    @Id
    private String id;
    private String state;
    private GitHubAuthMode mode;
    private GitHubAuthRequestStatus status;
    private String userId;
    private Date expiration;
    private Date createdAt;
    private Date updatedAt;
    private Long githubUserId;
    private String githubUsername;
    private String githubName;
    private String githubEmail;
    private String githubAvatarUrl;
    private String githubProfileUrl;
}
