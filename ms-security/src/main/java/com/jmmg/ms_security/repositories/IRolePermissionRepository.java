package com.jmmg.ms_security.repositories;

import java.util.List;
import org.bson.types.ObjectId;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import com.jmmg.ms_security.models.RolePermission;

public interface IRolePermissionRepository extends MongoRepository<RolePermission, String> {

    @Query("{'role.$id': ObjectId(?0), 'permission.$id': ObjectId(?1)}")
    RolePermission getRolePermission(String roleId, String permissionId);

    @Query("{'role.$id': ObjectId(?0)}")
    List<RolePermission> findByRoleId(String roleId);

    @Query("{'role.$id': {'$in': ?0}}")
    List<RolePermission> findByRoleIdIn(List<ObjectId> roleIds);

    @Query(value = "{'role.$id': {'$in': ?0}, 'permission.$id': ObjectId(?1)}", exists = true)
    boolean existsByRoleIdsAndPermissionId(List<ObjectId> roleIds, String permissionId);
}
