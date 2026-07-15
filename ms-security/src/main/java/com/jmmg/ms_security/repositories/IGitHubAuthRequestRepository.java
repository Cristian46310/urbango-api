package com.jmmg.ms_security.repositories;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.jmmg.ms_security.models.GitHubAuthRequest;
import com.jmmg.ms_security.models.GitHubAuthRequestStatus;

public interface IGitHubAuthRequestRepository extends JpaRepository<GitHubAuthRequest, UUID> {

    Optional<GitHubAuthRequest> findByStateAndStatus(String state, GitHubAuthRequestStatus status);
}
