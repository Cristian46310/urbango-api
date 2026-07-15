package com.jmmg.ms_security.repositories;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.jmmg.ms_security.models.Profile;

public interface IProfileRepository extends JpaRepository<Profile, UUID> {

    Optional<Profile> findByUser_Id(UUID userId);

    default Optional<Profile> findByUserId(UUID userId) {
        return findByUser_Id(userId);
    }

    default Optional<Profile> findByUserId(String userId) {
        return findByUser_Id(UUID.fromString(userId));
    }
}
