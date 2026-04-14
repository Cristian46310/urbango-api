package com.jmmg.ms_security.models;

import java.util.Date;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.Data;

@Data
@Document
@CompoundIndex(name = "microsoft_provider_user_id_unique_idx", def = "{'providerUserId': 1}", unique = true)
@CompoundIndex(name = "microsoft_user_id_unique_idx", def = "{'userId': 1}", unique = true)
public class MicrosoftAccount {
    @Id
    private String id;
    private String userId;
    private String providerUserId;
    private String displayName;
    private String email;
    private Date linkedAt;
    private Date createdAt;
    private Date updatedAt;
}
