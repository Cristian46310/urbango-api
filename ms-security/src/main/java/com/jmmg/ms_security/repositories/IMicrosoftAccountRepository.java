package com.jmmg.ms_security.repositories;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.jmmg.ms_security.models.MicrosoftAccount;

public interface IMicrosoftAccountRepository extends JpaRepository<MicrosoftAccount, UUID> {

    Optional<MicrosoftAccount> findByProviderUserId(String providerUserId);

    Optional<MicrosoftAccount> findByUserId(UUID userId);

    default Optional<MicrosoftAccount> findByUserId(String userId) {
        return findByUserId(UUID.fromString(userId));
    }
}
