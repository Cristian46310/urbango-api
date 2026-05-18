package com.jmmg.ms_security.repositories;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import com.jmmg.ms_security.models.Permission;

public interface IPermissionRepository extends MongoRepository<Permission, String> {

    @Query("{'url': ?0, 'method': ?1}")
    Permission getPermission(String url, String method);

    @Query("{'role': { $in: ?0 }, 'method': ?1}")
    List<Permission> findByRolesAndMethod(List<String> roles, String method);

    List<Permission> findByMethod(com.jmmg.ms_security.models.Method method);
}