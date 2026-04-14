package com.jmmg.ms_security.DTOs.Profile;

import com.jmmg.ms_security.models.Profile;

public record GetProfileDTO(
        String id,
        String phone,
        String photo,
        String userId,
        UserSummaryDTO user
        ) {

    public record UserSummaryDTO(String userId, String userName) {
        public static UserSummaryDTO fromModel(Profile profile) {
            if (profile == null || profile.getUser() == null) {
                return null;
            }

            return new UserSummaryDTO(
                    profile.getUser().getId(),
                    profile.getUser().getName()
            );
        }
    }

    public static GetProfileDTO fromModel(Profile profile) {
        if (profile == null) {
            return null;
        }

        UserSummaryDTO user = UserSummaryDTO.fromModel(profile);
        return new GetProfileDTO(
                profile.getId(),
                profile.getPhone(),
                profile.getPhoto(),
                profile.getUser() != null ? profile.getUser().getId() : null,
                user
        );
    }
}
