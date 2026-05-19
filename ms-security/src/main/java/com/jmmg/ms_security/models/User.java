package com.jmmg.ms_security.models;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

import com.jmmg.ms_security.DTOs.login.LoginDTO;
import com.jmmg.ms_security.DTOs.user.PostUserDTO;

import lombok.Data;

@Data
@Document
@CompoundIndex(name = "email_unique_idx", def = "{'email': 1}", unique = true)
public class User {
    @Id
    private String id;
    private String name;
    private String email;
    private String password;
    private String enterpriseId; // UUID de la empresa en ms-business

    public User() {
    }

    public User(String name, String email, String password) {
        this.name = name;
        this.email = email;
        this.password = password;
    }

    public User(LoginDTO loginDTO) {
        this.email = loginDTO.email();
        this.password = loginDTO.password();
    }

    public User(PostUserDTO postUserDTO) {
        this.name = postUserDTO.name();
        this.email = postUserDTO.email();
        this.password = postUserDTO.password();
    }

    public void updateFromDTO(PostUserDTO postUserDTO) {
        this.name = postUserDTO.name();
        this.email = postUserDTO.email();
        this.password = postUserDTO.password();
    }
}