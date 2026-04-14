package com.jmmg.ms_security.repositories;

import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.jmmg.ms_security.models.MicrosoftAuthRequest;
import com.jmmg.ms_security.models.MicrosoftAuthRequestStatus;

public interface IMicrosoftAuthRequestRepository extends MongoRepository<MicrosoftAuthRequest, String> {

    Optional<MicrosoftAuthRequest> findByStateAndStatus(String state, MicrosoftAuthRequestStatus status);
}
