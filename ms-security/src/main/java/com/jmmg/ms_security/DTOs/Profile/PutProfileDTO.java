package com.jmmg.ms_security.DTOs.Profile;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record PutProfileDTO(
        @NotBlank(message = "Phone number is required") @Size(max = 10, message = "Phone number must be at most 10 characters") @Pattern(regexp = "^[0-9]+$", message = "Phone number must contain only digits") String phone,
        @NotBlank(message = "Photo URL is required") String photo,
        @NotBlank(message = "User ID is required") String userId) {

}
