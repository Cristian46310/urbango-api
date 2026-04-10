package com.jmmg.ms_security.services;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.jmmg.ms_security.DTOs.user.GetUserDTO;
import com.jmmg.ms_security.DTOs.user.PostUserDTO;
import com.jmmg.ms_security.DTOs.user_role.UserRoleDTO;
import com.jmmg.ms_security.models.GitHubAccount;
import com.jmmg.ms_security.models.Profile;
import com.jmmg.ms_security.models.Session;
import com.jmmg.ms_security.models.User;
import com.jmmg.ms_security.models.UserRole;
import com.jmmg.ms_security.repositories.IGitHubAccountRepository;
import com.jmmg.ms_security.repositories.IProfileRepository;
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
    private IGitHubAccountRepository gitHubAccountRepository;
    @Autowired
    private EncryptionService encryptionService;

    public GetUserDTO create(PostUserDTO postUserDTO) {
        // buscar si ya no existe ese usuario en la base de datos
        User newUser = new User(postUserDTO);
        newUser.setPassword(encryptionService.convertSHA256(postUserDTO.password()));
        return GetUserDTO.fromModel(userRepository.save(newUser));
    }

    public List<GetUserDTO> getAll() {
        List<User> users = userRepository.findAll();
        List<String> userIds = users.stream().map(User::getId).toList();
        java.util.Map<String, GitHubAccount> gitHubAccountsByUserId = this.gitHubAccountRepository.findByUserIdIn(userIds)
                .stream()
                .collect(java.util.stream.Collectors.toMap(GitHubAccount::getUserId, account -> account));

        return users.stream()
                .map(user -> {
                    List<UserRole> userRoles = userRoleRepository.findByUserId(user.getId());
                    List<UserRoleDTO> roles = userRoles.stream()
                            .map(UserRoleDTO::fromModel)
                            .collect(java.util.stream.Collectors.toList());
                    return GetUserDTO.fromModelWithGitHub(user, gitHubAccountsByUserId.get(user.getId()), roles);
                })
                .collect(java.util.stream.Collectors.toList());
    }

    public GetUserDTO getById(String id) {
        User user = userRepository.findById(id).orElse(null);
        GitHubAccount gitHubAccount = user != null ? this.gitHubAccountRepository.findByUserId(user.getId()).orElse(null) : null;
        return GetUserDTO.fromModelWithGitHub(user, gitHubAccount, null);
    }

    public GetUserDTO update(String id, PostUserDTO newUser) {
        User user = userRepository.findById(id).orElse(null);
        if (user != null) {
            user.updateFromDTO(newUser);
            user.setPassword(encryptionService.convertSHA256(newUser.password()));
            User savedUser = userRepository.save(user);
            GitHubAccount gitHubAccount = this.gitHubAccountRepository.findByUserId(savedUser.getId()).orElse(null);
            return GetUserDTO.fromModelWithGitHub(savedUser, gitHubAccount, null);
        }
        return null;
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
