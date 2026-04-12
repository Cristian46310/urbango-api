package com.jmmg.ms_security.models;

import java.util.Date;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.Data;

@Data
@Document
@CompoundIndex(name = "microsoft_auth_state_unique_idx", def = "{'state': 1}", unique = true)
public class MicrosoftAuthRequest {
    @Id
    private String id;
    private String state;
    private String nonce;
    private String codeVerifier;
    private MicrosoftAuthMode mode;
    private MicrosoftAuthRequestStatus status;
    private String userId;
    private Date expiration;
    private Date createdAt;
    private Date updatedAt;

    private String microsoftUserId;
    private String microsoftName;
    private String microsoftEmail;
    private String microsoftPhone;
    private String microsoftPhotoUrl;
}
