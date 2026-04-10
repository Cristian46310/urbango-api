package com.jmmg.ms_security.repositories;

import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.jmmg.ms_security.models.GitHubAuthRequest;
import com.jmmg.ms_security.models.GitHubAuthRequestStatus;

public interface IGitHubAuthRequestRepository extends MongoRepository<GitHubAuthRequest, String> {

    Optional<GitHubAuthRequest> findByStateAndStatus(String state, GitHubAuthRequestStatus status);
}
