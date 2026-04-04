package com.jmmg.ms_security.repositories;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import com.jmmg.ms_security.models.RolePermission;

public interface IRolePermissionRepository extends MongoRepository<RolePermission, String> {

    @Query("{'role.$id': ObjectId(?0), 'permission.$id': ObjectId(?1)}")
    RolePermission getRolePermission(String roleId, String permissionId);
}
