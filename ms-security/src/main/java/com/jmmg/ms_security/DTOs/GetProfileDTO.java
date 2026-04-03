package com.jmmg.ms_security.DTOs;

import com.jmmg.ms_security.models.Profile;

public record GetProfileDTO(
        String id,
        String phone,
        String photo,
        String userId
        ) {

    public static GetProfileDTO fromModel(Profile profile) {
        if (profile == null) {
            return null;
        }
        return new GetProfileDTO(
                profile.getId(),
                profile.getPhone(),
                profile.getPhoto(),
                profile.getUser() != null ? profile.getUser().getId () : null
        );
    }
}
