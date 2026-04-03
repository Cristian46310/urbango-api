package com.jmmg.ms_security.DTOs;

import java.util.List;

public record AssignRolesDTO(
    String userId,
    List<String> roleIds
) {
}