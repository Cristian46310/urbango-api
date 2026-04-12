package com.jmmg.ms_security.DTOs.user;

import java.util.List;

import com.jmmg.ms_security.DTOs.Profile.GetProfileDTO;
import com.jmmg.ms_security.DTOs.permission.GetPermissionDTO;

public record GetUserDetailDTO(
        String id,
        String name,
        String email,
        GetProfileDTO profile,
        List<RoleSummaryDTO> roles,
        List<GetPermissionDTO> permissions) {
}
