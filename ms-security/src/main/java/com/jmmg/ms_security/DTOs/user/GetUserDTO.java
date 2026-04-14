package com.jmmg.ms_security.DTOs.user;

import com.jmmg.ms_security.models.User;
import com.jmmg.ms_security.models.UserRole;
import java.util.List;
import java.util.stream.Collectors;

public record GetUserDTO(
        String id,
        String name,
        String email,
        List<RoleSummaryDTO> roles) {

    public static GetUserDTO fromModel(User user) {
        if (user == null) {
            return null;
        }
        return new GetUserDTO(user.getId(), user.getName(), user.getEmail(), null);
    }

    public static GetUserDTO fromModelWithRoles(User user, List<RoleSummaryDTO> roles) {
        if (user == null) {
            return null;
        }
        return new GetUserDTO(
                user.getId(),
                user.getName(),
                user.getEmail(),
                roles);
    }

    public static GetUserDTO fromModelWithUserRoles(User user, List<UserRole> userRoles) {
        if (user == null) {
            return null;
        }
        List<RoleSummaryDTO> roles = userRoles.stream()
            .map(UserRole::getRole)
            .map(RoleSummaryDTO::fromModel)
            .collect(Collectors.toList());
        return fromModelWithRoles(user, roles);
    }
}
