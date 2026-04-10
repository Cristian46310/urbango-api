package com.jmmg.ms_security.models;

import java.util.Date;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.DBRef;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.Data;

@Data
@Document
public class AuthFactor {

    @Id
    private String id;
    @DBRef
    private User user;
    private String code;
    private Date expiration;
    private String token;
    private AuthFactorStatus status;
    private AuthFactorType type;
    private Date createdAt;
    private Date updatedAt;
}
