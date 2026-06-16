package com.jmmg.ms_security.services;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

import org.bson.types.ObjectId;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.jmmg.ms_security.DTOs.Profile.GetProfileDTO;
import com.jmmg.ms_security.DTOs.permission.GetPermissionDTO;
import com.jmmg.ms_security.DTOs.user.GetUserDetailDTO;
import com.jmmg.ms_security.DTOs.user.GetUserListDTO;
import com.jmmg.ms_security.DTOs.user.GetUserDTO;
import com.jmmg.ms_security.DTOs.user.PostUserDTO;
import com.jmmg.ms_security.DTOs.user.RoleSummaryDTO;
import com.jmmg.ms_security.models.Permission;
import com.jmmg.ms_security.models.Profile;
import com.jmmg.ms_security.models.Role;
import com.jmmg.ms_security.models.RolePermission;
import com.jmmg.ms_security.models.Session;
import com.jmmg.ms_security.models.User;
import com.jmmg.ms_security.models.UserRole;
import com.jmmg.ms_security.repositories.IProfileRepository;
import com.jmmg.ms_security.repositories.IRolePermissionRepository;
import com.jmmg.ms_security.repositories.ISessionRepository;
import com.jmmg.ms_security.repositories.IUserRepository;
import com.jmmg.ms_security.repositories.IUserRoleRepository;

@Service
public class UserService {

    @Autowired
    private IUserRepository userRepository;
    @Autowired
    private IProfileRepository profileRepository;
    @Autowired
    private ISessionRepository sessionRepository;
    @Autowired
    private IUserRoleRepository userRoleRepository;
    @Autowired
    private IRolePermissionRepository rolePermissionRepository;
    @Autowired
    private EncryptionService encryptionService;

    public GetUserDTO create(PostUserDTO postUserDTO) {
        // buscar si ya no existe ese usuario en la base de datos
        User newUser = new User(postUserDTO);
        newUser.setPassword(encryptionService.convertSHA256(postUserDTO.password()));
        return GetUserDTO.fromModel(userRepository.save(newUser));
    }

    public Page<GetUserListDTO> getAll(Pageable pageable) {
        return this.userRepository.findAll(pageable)
                .map(GetUserListDTO::fromModel);
    }

    public Page<GetUserListDTO> searchByNameOrEmail(String query, Pageable pageable) {
        String normalizedQuery = query == null ? "" : query.trim();
        if (normalizedQuery.isEmpty()) {
            return Page.empty(pageable);
        }
        return this.userRepository.searchByNameOrEmail(normalizedQuery, pageable)
                .map(GetUserListDTO::fromModel);
    }

    public GetUserDTO getById(String id) {
        User user = userRepository.findById(id).orElse(null);
        List<RoleSummaryDTO> roles = user != null ? this.getRoleSummariesByUserId(user.getId()) : null;
        return GetUserDTO.fromModelWithRoles(user, roles);
    }

    public GetUserDetailDTO getDetailById(String id) {
        User user = this.userRepository.findById(id).orElse(null);
        if (user == null) {
            return null;
        }

        Profile profile = this.profileRepository.findByUserId(user.getId()).orElse(null);
        List<UserRole> userRoles = this.userRoleRepository.findByUserId(user.getId());

        List<RoleSummaryDTO> roles = userRoles.stream()
                .map(UserRole::getRole)
                .filter(java.util.Objects::nonNull)
            .map(RoleSummaryDTO::fromModel)
                .collect(Collectors.toList());

        List<GetPermissionDTO> permissions = this.getPermissionsForRoles(
                userRoles.stream()
                        .map(UserRole::getRole)
                        .filter(Objects::nonNull)
                        .toList());

        return new GetUserDetailDTO(
                user.getId(),
                user.getName(),
                user.getEmail(),
                GetProfileDTO.fromModel(profile),
                roles,
                permissions);
    }

    public GetUserDTO update(String id, PostUserDTO newUser) {
        User user = userRepository.findById(id).orElse(null);
        if (user != null) {
            user.updateFromDTO(newUser);
            user.setPassword(encryptionService.convertSHA256(newUser.password()));
            User savedUser = userRepository.save(user);
            List<RoleSummaryDTO> roles = this.getRoleSummariesByUserId(savedUser.getId());
            return GetUserDTO.fromModelWithRoles(savedUser, roles);
        }
        return null;
    }

    /**
     * Consulta ligera para validate-token: solo nombres de rol, sin perfil ni permisos.
     */
    public List<String> getRoleNamesByUserId(String userId) {
        return this.userRoleRepository.findByUserId(userId).stream()
                .map(UserRole::getRole)
                .filter(Objects::nonNull)
                .map(Role::getName)
                .filter(Objects::nonNull)
                .distinct()
                .collect(Collectors.toList());
    }

    private List<RoleSummaryDTO> getRoleSummariesByUserId(String userId) {
        List<UserRole> userRoles = this.userRoleRepository.findByUserId(userId);
        return userRoles.stream()
                .map(UserRole::getRole)
                .filter(Objects::nonNull)
                .map(RoleSummaryDTO::fromModel)
                .collect(Collectors.toList());
    }

    private List<GetPermissionDTO> getPermissionsForRoles(List<Role> roles) {
        List<ObjectId> roleIds = roles.stream()
                .map(Role::getId)
                .filter(Objects::nonNull)
                .filter(ObjectId::isValid)
                .map(ObjectId::new)
                .distinct()
                .toList();

        if (roleIds.isEmpty()) {
            return List.of();
        }

        return this.rolePermissionRepository.findByRoleIdIn(roleIds).stream()
                .map(RolePermission::getPermission)
                .filter(Objects::nonNull)
                .collect(Collectors.toMap(
                        Permission::getId,
                        permission -> permission,
                        (existing, replacement) -> existing,
                        LinkedHashMap::new))
                .values().stream()
                .map(GetPermissionDTO::fromModel)
                .collect(Collectors.toList());
    }

    public void delete(String id) {
        userRepository.deleteById(id);
    }

    public boolean updatePassword(String userId, String newPlainPassword) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return false;
        }
        user.setPassword(encryptionService.convertSHA256(newPlainPassword));
        userRepository.save(user);
        return true;
    }

    public boolean addProfile(String userId, String profileId) {
        User user = this.userRepository.findById(userId).orElse(null);
        Profile profile = this.profileRepository.findById(profileId).orElse(null);
        if (user != null && profile != null) {
            profile.setUser(user);
            this.profileRepository.save(profile);
            return true;
        } else {
            return false;
        }
    }

    public boolean removeProfile(String userId, String profileId) {
        User user = this.userRepository.findById(userId).orElse(null);
        Profile profile = this.profileRepository.findById(profileId).orElse(null);
        if (user != null && profile != null) {
            profile.setUser(null);
            this.profileRepository.save(profile);
            return true;
        } else {
            return false;
        }
    }

    public boolean addSession(String userId, String sessionId) {
        User theUser = this.userRepository.findById(userId).orElse(null);
        Session session = this.sessionRepository.findById(sessionId).orElse(null);
        if (theUser != null && session != null) {
            session.setUser(theUser);
            this.sessionRepository.save(session);
            return true;
        } else {
            return false;
        }
    }

    public boolean removeSession(String userId, String sessionId) {
        User user = this.userRepository.findById(userId).orElse(null);
        Session session = this.sessionRepository.findById(sessionId).orElse(null);
        if (user != null && session != null) {
            session.setUser(null);
            this.sessionRepository.save(session);
            return true;
        } else {
            return false;
        }
    }

}
