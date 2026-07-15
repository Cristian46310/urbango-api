package com.jmmg.ms_security.repositories;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.jmmg.ms_security.models.MicrosoftAuthRequest;
import com.jmmg.ms_security.models.MicrosoftAuthRequestStatus;

public interface IMicrosoftAuthRequestRepository extends JpaRepository<MicrosoftAuthRequest, UUID> {

    Optional<MicrosoftAuthRequest> findByStateAndStatus(String state, MicrosoftAuthRequestStatus status);
}
