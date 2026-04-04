package com.jmmg.ms_security.repositories;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import com.jmmg.ms_security.models.Permission;

public interface IPermissionRepository extends MongoRepository<Permission, String> {

    @Query("{'url': ?0, 'method': ?1}")
    Permission getPermission(String url, String method);
}
