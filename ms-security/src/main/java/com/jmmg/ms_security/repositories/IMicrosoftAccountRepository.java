package com.jmmg.ms_security.repositories;

import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.jmmg.ms_security.models.MicrosoftAccount;

public interface IMicrosoftAccountRepository extends MongoRepository<MicrosoftAccount, String> {

    Optional<MicrosoftAccount> findByProviderUserId(String providerUserId);

    Optional<MicrosoftAccount> findByUserId(String userId);
}
