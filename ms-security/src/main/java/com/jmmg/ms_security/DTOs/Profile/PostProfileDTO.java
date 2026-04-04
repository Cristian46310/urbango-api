package com.jmmg.ms_security.DTOs.Profile;

import com.jmmg.ms_security.models.Profile;

public record PostProfileDTO(
        String phone,
        String photo,
        String userId) {
    public static PostProfileDTO fromModel(Profile profile) {
        if (profile == null) {
            return null;
        }
        return new PostProfileDTO(
                profile.getPhone(),
                profile.getPhoto(),
                profile.getUser() != null ? profile.getUser().getId() : null);
    }
}
