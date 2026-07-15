package com.jmmg.ms_security.DTOs.permission;

import com.jmmg.ms_security.models.Method;
import com.jmmg.ms_security.models.Permission;

public record GetPermissionDTO(
        String id,
        String url,
        Method method) {
    public static GetPermissionDTO fromModel(Permission permission) {
        if (permission == null) {
            return null;
        }
        return new GetPermissionDTO(permission.getIdAsString(), permission.getUrl(), permission.getMethod());
    }
}
