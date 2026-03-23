package com.jmmg.ms_security.models;

import com.jmmg.ms_security.DTOs.GetSessionDTO;
import com.jmmg.ms_security.DTOs.PostSessionDTO;
import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Date;

@Data
@Document
public class Session {
    @Id
    private String id;
    private String token;
    private Date expiration;
    private String code2FA;
    private User user;
    
    public Session(){

    }
    public Session(String token, Date expiration, String code2FA) {
        this.token = token;
        this.expiration = expiration;
        this.code2FA = code2FA;
    }

    public Session(GetSessionDTO getSessionDTO) {
        this.id = getSessionDTO.id();
        this.token = getSessionDTO.token();
        this.expiration = getSessionDTO.expiration();
        this.code2FA = getSessionDTO.code2FA();
        if (getSessionDTO.userId() != null) {
            User user = new User();
            user.setId(getSessionDTO.userId());
            this.user = user;
        }
    }

    public Session(PostSessionDTO postSessionDTO) {
        this.token = postSessionDTO.token();
        this.expiration = postSessionDTO.expiration();
        this.code2FA = postSessionDTO.code2FA();
        if (postSessionDTO.userId() != null) {
            User user = new User();
            user.setId(postSessionDTO.userId());
            this.user = user;
        }
    }

    public void updateFromDTO(PostSessionDTO postSessionDTO) {
        this.token = postSessionDTO.token();
        this.expiration = postSessionDTO.expiration();
        this.code2FA = postSessionDTO.code2FA();
        if (postSessionDTO.userId() != null) {
            User user = new User();
            user.setId(postSessionDTO.userId());
            this.user = user;
        }
    }
}
