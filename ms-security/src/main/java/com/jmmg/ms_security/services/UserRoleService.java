package com.jmmg.ms_security.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.jmmg.ms_security.models.Role;
import com.jmmg.ms_security.models.User;
import com.jmmg.ms_security.models.UserRole;
import com.jmmg.ms_security.repositories.IRoleRepository;
import com.jmmg.ms_security.repositories.IUserRepository;
import com.jmmg.ms_security.repositories.IUserRoleRepository;

@Service
public class UserRoleService {
    @Autowired
    private IUserRepository userRepository;

    @Autowired
    private IRoleRepository roleRepository;

    @Autowired
    private IUserRoleRepository userRoleRepository;

    public boolean addUserRole(String userId,
            String roleId) {
        User user = this.userRepository.findById(userId).orElse(null);
        Role role = this.roleRepository.findById(roleId).orElse(null);
        if (user != null && role != null) {
            UserRole userRole = new UserRole(user, role);
            this.userRoleRepository.save(userRole);
            return true;
        } else {
            return false;
        }
    }

    public boolean removeUserRole(String userRoleId) {
        UserRole userRole = this.userRoleRepository.findById(userRoleId).orElse(null);
        if (userRole != null) {
            this.userRoleRepository.delete(userRole);
            return true;
        } else {
            return false;
        }
    }

}