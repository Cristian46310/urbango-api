package com.jmmg.ms_security.repositories;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.jmmg.ms_security.models.UserRole;

public interface IUserRoleRepository extends JpaRepository<UserRole, UUID> {

    List<UserRole> findByUser_Id(UUID userId);

    boolean existsByRole_Id(UUID roleId);

    /** Compatibilidad con código existente que llama findByUserId / existsByRoleId */
    default List<UserRole> findByUserId(UUID userId) {
        return findByUser_Id(userId);
    }

    default boolean existsByRoleId(UUID roleId) {
        return existsByRole_Id(roleId);
    }

    default List<UserRole> findByUserId(String userId) {
        return findByUser_Id(UUID.fromString(userId));
    }

    default boolean existsByRoleId(String roleId) {
        return existsByRole_Id(UUID.fromString(roleId));
    }
}
