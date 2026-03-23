package com.jmmg.ms_security.models;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.DBRef;
import org.springframework.data.mongodb.core.mapping.Document;

import com.jmmg.ms_security.DTOs.GetProfileDTO;
import com.jmmg.ms_security.DTOs.PostProfileDTO;

@Data
@Document
public class Profile {
    @Id
    private String id;

    private String phone;
    private String photo;

    @DBRef
    private User user;

    public Profile() {

    }

    public Profile(String phone, String photo) {
        this.phone = phone;
        this.photo = photo;
    }

    public Profile(GetProfileDTO getProfileDTO) {
        this.id = getProfileDTO.id();
        this.phone = getProfileDTO.phone();
        this.photo = getProfileDTO.photo();
        if (getProfileDTO.userId() != null) {
            User user = new User();
            user.setId(getProfileDTO.userId());
            this.user = user;
        }
    }

    public Profile(PostProfileDTO postProfileDTO) {
        this.phone = postProfileDTO.phone();
        this.photo = postProfileDTO.photo();
        if (postProfileDTO.userId() != null) {
            User user = new User();
            user.setId(postProfileDTO.userId());
            this.user = user;
        }
    }

    public void updateFromDTO(PostProfileDTO postProfileDTO) {
        this.phone = postProfileDTO.phone();
        this.photo = postProfileDTO.photo();
        if (postProfileDTO.userId() != null) {
            User user = new User();
            user.setId(postProfileDTO.userId());
            this.user = user;
        }
    }
}
