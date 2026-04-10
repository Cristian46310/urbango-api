package com.jmmg.ms_security.repositories;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import com.jmmg.ms_security.models.AuthFactor;
import com.jmmg.ms_security.models.AuthFactorStatus;

public interface IAuthFactor extends MongoRepository<AuthFactor, String> {

    @Query("{'user.$id': ?0, 'status': ?1}")
    List<AuthFactor> findByUserIdAndStatus(String userId, AuthFactorStatus status);

    @Query("{'user.$id': ?0, 'status': ?1, 'type': ?2}")
    List<AuthFactor> findByUserIdAndStatusAndType(String userId, AuthFactorStatus status, com.jmmg.ms_security.models.AuthFactorType type);

    AuthFactor findByTokenAndStatus(String token, AuthFactorStatus status);

    AuthFactor findByTokenAndStatusAndType(String token, AuthFactorStatus status, com.jmmg.ms_security.models.AuthFactorType type);
}
