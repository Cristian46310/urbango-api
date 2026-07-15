package com.jmmg.ms_security.repositories;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.jmmg.ms_security.models.AuthFactor;
import com.jmmg.ms_security.models.AuthFactorStatus;
import com.jmmg.ms_security.models.AuthFactorType;

public interface IAuthFactor extends JpaRepository<AuthFactor, UUID> {

    List<AuthFactor> findByUser_IdAndStatus(UUID userId, AuthFactorStatus status);

    List<AuthFactor> findByUser_IdAndStatusAndType(UUID userId, AuthFactorStatus status, AuthFactorType type);

    default List<AuthFactor> findByUserIdAndStatus(UUID userId, AuthFactorStatus status) {
        return findByUser_IdAndStatus(userId, status);
    }

    default List<AuthFactor> findByUserIdAndStatus(String userId, AuthFactorStatus status) {
        return findByUser_IdAndStatus(UUID.fromString(userId), status);
    }

    default List<AuthFactor> findByUserIdAndStatusAndType(
            UUID userId, AuthFactorStatus status, AuthFactorType type) {
        return findByUser_IdAndStatusAndType(userId, status, type);
    }

    default List<AuthFactor> findByUserIdAndStatusAndType(
            String userId, AuthFactorStatus status, AuthFactorType type) {
        return findByUser_IdAndStatusAndType(UUID.fromString(userId), status, type);
    }

    AuthFactor findByTokenAndStatus(String token, AuthFactorStatus status);

    AuthFactor findByTokenAndStatusAndType(String token, AuthFactorStatus status, AuthFactorType type);
}
