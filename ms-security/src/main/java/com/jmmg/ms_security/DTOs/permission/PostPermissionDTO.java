package com.jmmg.ms_security.DTOs.permission;

import com.jmmg.ms_security.models.Permission;

public record PostPermissionDTO(
        String url,
        String method) {
    public static PostPermissionDTO fromModel(Permission permission) {
        if (permission == null) {
            return null;
        }
        return new PostPermissionDTO(permission.getUrl(), permission.getMethod());
    }
}
