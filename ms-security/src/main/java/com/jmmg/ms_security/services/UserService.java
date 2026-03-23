package com.jmmg.ms_security.services;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.jmmg.ms_security.DTOs.GetUserDTO;
import com.jmmg.ms_security.DTOs.PostUserDTO;
import com.jmmg.ms_security.models.Profile;
import com.jmmg.ms_security.models.Session;
import com.jmmg.ms_security.models.User;
import com.jmmg.ms_security.repositories.IProfileRepository;
import com.jmmg.ms_security.repositories.ISessionRepository;
import com.jmmg.ms_security.repositories.IUserRepository;

@Service
public class UserService {
    @Autowired
    private IUserRepository userRepository;
    @Autowired
    private IProfileRepository profileRepository;
    @Autowired
    private ISessionRepository sessionRepository;
    @Autowired
    private EncryptionService encryptionService;

    public GetUserDTO save(PostUserDTO postUserDTO) {
        // buscar si ya no existe ese usuario en la base de datos
        User newUser = new User(postUserDTO);
        newUser.setPassword(encryptionService.convertSHA256(postUserDTO.password()));
        return GetUserDTO.fromModel(userRepository.save(newUser));
    }

    public List<GetUserDTO> getAll() {
        return userRepository.findAll().stream()
                .map(GetUserDTO::fromModel)
                .collect(java.util.stream.Collectors.toList());
    }

    public GetUserDTO getById(String id) {
        return GetUserDTO.fromModel(userRepository.findById(id).orElse(null));
    }

    public GetUserDTO update(String id, PostUserDTO newUser) {
        User user = userRepository.findById(id).orElse(null);
        if (user != null) {
            user.updateFromDTO(newUser);
            return GetUserDTO.fromModel(userRepository.save(user));
        }
        return null;
    }

    public void delete(String id) {
        userRepository.deleteById(id);
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
