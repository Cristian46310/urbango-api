package com.jmmg.ms_security.DTOs.Profile;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record PostProfileDTO(
        @NotBlank(message = "Phone number is required") @Size(min = 10, max = 10, message = "Phone number must be exactly 10 digits") @Pattern(regexp = "^[0-9]+$", message = "Phone number must contain only digits") String phone,
        @NotBlank(message = "Photo URL is required") String photo) {

}
