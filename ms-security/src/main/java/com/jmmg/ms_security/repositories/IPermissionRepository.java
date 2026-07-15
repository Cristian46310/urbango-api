package com.jmmg.ms_security.repositories;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.jmmg.ms_security.models.Method;
import com.jmmg.ms_security.models.Permission;

public interface IPermissionRepository extends JpaRepository<Permission, UUID> {

    Permission findByUrlAndMethod(String url, Method method);

    default Permission getPermission(String url, String method) {
        try {
            return findByUrlAndMethod(url, Method.valueOf(method));
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }

    List<Permission> findByMethod(Method method);
}
