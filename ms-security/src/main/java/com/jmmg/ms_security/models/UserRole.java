package com.jmmg.ms_security.models;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.mapping.DBRef;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@Document
@CompoundIndexes({
    @CompoundIndex(name = "user_role_unique_idx", def = "{'userId': 1, 'roleId': 1}", unique = true),
    @CompoundIndex(name = "user_idx", def = "{'userId': 1}"),
    @CompoundIndex(name = "role_idx", def = "{'roleId': 1}")
}) // indexes para mejorar el rendimiento de las consultas y garantizar la unicidad de la relación
public class UserRole {
    @Id
    private String id;

    @DBRef
    private User user;
    @DBRef
    private Role role;

    public UserRole(){
    }

    public UserRole(User user, Role role){
        this.user=user;
        this.role=role;
    }
}




