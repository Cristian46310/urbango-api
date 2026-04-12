package com.jmmg.ms_security.DTOs.user;

import com.jmmg.ms_security.models.User;

public record GetUserListDTO(
        String id,
        String name,
        String email) {

    public static GetUserListDTO fromModel(User user) {
        if (user == null) {
            return null;
        }
        return new GetUserListDTO(user.getId(), user.getName(), user.getEmail());
    }
}
