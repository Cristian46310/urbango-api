package com.jmmg.ms_security.services;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import com.jmmg.ms_security.models.Role;
import com.jmmg.ms_security.models.User;
import com.jmmg.ms_security.models.UserRole;
import com.jmmg.ms_security.repositories.IRoleRepository;
import com.jmmg.ms_security.repositories.IUserRepository;
import com.jmmg.ms_security.repositories.IUserRoleRepository;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    @Autowired
    private IUserRepository userRepository;
    @Autowired
    private IUserRoleRepository userRoleRepository;
    @Autowired
    private IRoleRepository roleRepository;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = userRepository.findByEmail(email);

        if (user == null) {
            throw new UsernameNotFoundException("Usuario no encontrado: " + email);
        }

        List<UserRole> userRoles = userRoleRepository.findByUserId(user.getId());

        List<String> roleIds = userRoles.stream()
            .map(userRole -> userRole.getRole().getId())
            .distinct()
            .toList();

        List<Role> roles = roleIds.isEmpty()
            ? List.of()
            : roleRepository.findByIdIn(roleIds);

        List<GrantedAuthority> authorities = roles.stream()
            .map(Role::getName)
            .map(roleName -> (GrantedAuthority) new SimpleGrantedAuthority("ROLE_" + roleName))
            .toList();

        return org.springframework.security.core.userdetails.User.builder()
            .username(user.getEmail())
            .password(user.getPassword())
            .authorities(authorities)
            .build();
    }
}