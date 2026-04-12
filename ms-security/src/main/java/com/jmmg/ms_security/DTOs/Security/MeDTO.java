package com.jmmg.ms_security.DTOs.Security;

import java.util.List;

import com.jmmg.ms_security.DTOs.Profile.GetProfileDTO;
import com.jmmg.ms_security.DTOs.Role.GetRoleDTO;
import com.jmmg.ms_security.DTOs.permission.GetPermissionDTO;

public record MeDTO(
        String name,
        String email,
        GetProfileDTO profile,
        List<GetRoleDTO> roles,
        List<GetPermissionDTO> permissions) {
}
