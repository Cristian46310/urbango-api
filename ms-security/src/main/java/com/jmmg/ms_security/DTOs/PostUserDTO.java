package com.jmmg.ms_security.DTOs;

import com.jmmg.ms_security.models.User;

public record PostUserDTO(String name,
        String email,
        String password) {

    public static PostUserDTO fromModel(User user) {
        if (user == null) {
            return null;
        }
        return new PostUserDTO(user.getName(), user.getEmail(), user.getPassword());
    }
}
