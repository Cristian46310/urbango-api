package com.jmmg.ms_security.repositories;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.jmmg.ms_security.models.RolePermission;

public interface IRolePermissionRepository extends JpaRepository<RolePermission, UUID> {

    @Query("""
            SELECT rp FROM RolePermission rp
            WHERE rp.role.id = :roleId AND rp.permission.id = :permissionId
            """)
    RolePermission getRolePermission(@Param("roleId") UUID roleId, @Param("permissionId") UUID permissionId);

    List<RolePermission> findByRole_Id(UUID roleId);

    default List<RolePermission> findByRoleId(UUID roleId) {
        return findByRole_Id(roleId);
    }

    default List<RolePermission> findByRoleId(String roleId) {
        return findByRole_Id(UUID.fromString(roleId));
    }

    List<RolePermission> findByRole_IdIn(List<UUID> roleIds);

    default List<RolePermission> findByRoleIdIn(List<UUID> roleIds) {
        return findByRole_IdIn(roleIds);
    }

    @Query("""
            SELECT CASE WHEN COUNT(rp) > 0 THEN true ELSE false END
            FROM RolePermission rp
            WHERE rp.role.id IN :roleIds AND rp.permission.id = :permissionId
            """)
    boolean existsByRoleIdsAndPermissionId(
            @Param("roleIds") List<UUID> roleIds, @Param("permissionId") UUID permissionId);

    default RolePermission getRolePermission(String roleId, String permissionId) {
        return getRolePermission(UUID.fromString(roleId), UUID.fromString(permissionId));
    }
}
