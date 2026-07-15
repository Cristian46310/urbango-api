package com.jmmg.ms_security.repositories;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.jmmg.ms_security.models.GitHubAccount;

public interface IGitHubAccountRepository extends JpaRepository<GitHubAccount, UUID> {

    Optional<GitHubAccount> findByProviderUserId(Long providerUserId);

    Optional<GitHubAccount> findByUserId(UUID userId);

    List<GitHubAccount> findByUserIdIn(Collection<UUID> userIds);

    default Optional<GitHubAccount> findByUserId(String userId) {
        return findByUserId(UUID.fromString(userId));
    }
}
