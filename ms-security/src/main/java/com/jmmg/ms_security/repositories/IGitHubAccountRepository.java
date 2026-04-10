package com.jmmg.ms_security.repositories;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.jmmg.ms_security.models.GitHubAccount;

public interface IGitHubAccountRepository extends MongoRepository<GitHubAccount, String> {

    Optional<GitHubAccount> findByProviderUserId(Long providerUserId);

    Optional<GitHubAccount> findByUserId(String userId);

    List<GitHubAccount> findByUserIdIn(Collection<String> userIds);
}
