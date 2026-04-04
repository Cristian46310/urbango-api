package com.jmmg.ms_security.DTOs.user;

import com.jmmg.ms_security.models.User;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Email;

public record PostUserDTO(
        @NotBlank(message = "Name is required")
        String name,
        @Email
        @NotBlank(message = "Email is required")
        String email,
        @NotBlank(message = "Password is required")
        @Pattern(regexp = "^(?=.*[A-Za-z])(?=.*\\d)[A-Za-z\\d]{8,}$", message = "Password must be at least 8 characters long and contain both letters and numbers")
        String password) {

    public static PostUserDTO fromModel(User user) {
        if (user == null) {
            return null;
        }
        return new PostUserDTO(user.getName(), user.getEmail(), user.getPassword());
    }
}
