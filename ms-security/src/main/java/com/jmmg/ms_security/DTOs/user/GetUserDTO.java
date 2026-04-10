package com.jmmg.ms_security.DTOs.user;

import com.jmmg.ms_security.DTOs.user_role.UserRoleDTO;
import com.jmmg.ms_security.models.GitHubAccount;
import com.jmmg.ms_security.models.User;
import com.jmmg.ms_security.models.UserRole;
import java.util.List;
import java.util.stream.Collectors;

public record GetUserDTO(
        String id,
        String name,
        String email,
        String githubUsername,
        Boolean githubLinked,
        List<UserRoleDTO> roles
        ) {

    public static GetUserDTO fromModel(User user) {
        if (user == null) {
            return null;
        }
        return new GetUserDTO(user.getId(), user.getName(), user.getEmail(), null, false, null);
    }

    public static GetUserDTO fromModelWithGitHub(User user, GitHubAccount gitHubAccount, List<UserRoleDTO> roles) {
        if (user == null) {
            return null;
        }
        return new GetUserDTO(
                user.getId(),
                user.getName(),
                user.getEmail(),
                gitHubAccount != null ? gitHubAccount.getUsername() : null,
                gitHubAccount != null,
                roles);
    }

    public static GetUserDTO fromModelWithRoles(User user, List<UserRole> userRoles) {
        if (user == null) {
            return null;
        }
        List<UserRoleDTO> roles = userRoles.stream()
                .map(UserRoleDTO::fromModel)
                .collect(Collectors.toList());
        return fromModelWithGitHub(user, null, roles);
    }
}
