package com.jmmg.ms_security.DTOs;

import com.jmmg.ms_security.models.User;
import com.jmmg.ms_security.models.UserRole;
import java.util.List;
import java.util.stream.Collectors;

public record GetUserDTO(
        String id,
        String name,
        String email,
        List<UserRoleDTO> roles
        ) {

    public static GetUserDTO fromModel(User user) {
        if (user == null) {
            return null;
        }
        return new GetUserDTO(user.getId(), user.getName(), user.getEmail(), null);
    }

    public static GetUserDTO fromModelWithRoles(User user, List<UserRole> userRoles) {
        if (user == null) {
            return null;
        }
        List<UserRoleDTO> roles = userRoles.stream()
                .map(UserRoleDTO::fromModel)
                .collect(Collectors.toList());
        return new GetUserDTO(user.getId(), user.getName(), user.getEmail(), roles);
    }
}
