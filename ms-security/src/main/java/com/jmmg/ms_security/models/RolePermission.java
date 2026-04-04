package com.jmmg.ms_security.models;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.mapping.DBRef;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.Data;

@Data
@Document
@CompoundIndexes({
    @CompoundIndex(name = "role_permission_unique_idx", def = "{'permission.$id': 1, 'role.$id': 1}", unique = true),
    @CompoundIndex(name = "permission_idx", def = "{'permission.$id': 1}"),
    @CompoundIndex(name = "role_idx", def = "{'role.$id': 1}")
}) // indexes para mejorar el rendimiento de las consultas y garantizar la unicidad de la relación
public class RolePermission {
    @Id
    private String id;
    @DBRef
    private Role role;
    @DBRef
    private Permission permission;

    public RolePermission() {
    }

    public RolePermission(Role role, Permission permission) {
        this.role = role;
        this.permission = permission;
    }
}
