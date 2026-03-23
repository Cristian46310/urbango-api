package com.jmmg.ms_security.models;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import com.jmmg.ms_security.DTOs.GetUserDTO;
import com.jmmg.ms_security.DTOs.PostUserDTO;

import lombok.Data;

@Data
@Document
public class User {
    @Id
    private String id;
    private String name;
    private String email;
    private String password;

    public User() {
    }

    public User(String name, String email, String password) {
        this.name = name;
        this.email = email;
        this.password = password;
    }

    public User(GetUserDTO getUserDTO) {
        this.id = getUserDTO.id();
        this.name = getUserDTO.name();
        this.email = getUserDTO.email();
        this.password = getUserDTO.password();
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