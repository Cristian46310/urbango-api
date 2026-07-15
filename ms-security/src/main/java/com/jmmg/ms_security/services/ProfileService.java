package com.jmmg.ms_security.services;

import com.jmmg.ms_security.DTOs.Profile.GetProfileDTO;
import com.jmmg.ms_security.DTOs.Profile.PostProfileDTO;
import com.jmmg.ms_security.models.Profile;
import com.jmmg.ms_security.models.User;
import com.jmmg.ms_security.repositories.IProfileRepository;
import com.jmmg.ms_security.repositories.IUserRepository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class ProfileService {
    @Autowired
    private IProfileRepository profileRepository;

    @Autowired
    private IUserRepository userRepository;

    public Page<GetProfileDTO> find(Pageable pageable) {
        return this.profileRepository.findAll(pageable)
                .map(GetProfileDTO::fromModel);
    }

    public GetProfileDTO findById(String id) {
        Profile profile = this.profileRepository.findById(UUID.fromString(id)).orElse(null);
        return GetProfileDTO.fromModel(profile);
    }

    public GetProfileDTO create(PostProfileDTO postProfile) {
        User user = this.userRepository.findById(UUID.fromString(postProfile.userId())).orElse(null);
        if (user == null) {
            return null;
        }

        if (this.profileRepository.findByUserId(user.getId()).isPresent()) {
            throw new IllegalArgumentException("User already has a profile");
        }

        Profile newProfile = new Profile(postProfile.phone(), postProfile.photo());
        newProfile.setUser(user);
        Profile savedProfile = this.profileRepository.save(newProfile);
        return GetProfileDTO.fromModel(savedProfile);
    }

    public GetProfileDTO update(String id, PostProfileDTO newProfile) {
        Profile actualProfile = this.profileRepository.findById(UUID.fromString(id)).orElse(null);

        if (actualProfile != null) {
            actualProfile.setPhone(newProfile.phone());
            actualProfile.setPhoto(newProfile.photo());
            this.profileRepository.save(actualProfile);
            return GetProfileDTO.fromModel(actualProfile);
        } else {
            return null;
        }
    }

    public void delete(String id) {
        Profile theProfile = this.profileRepository.findById(UUID.fromString(id)).orElse(null);
        if (theProfile != null) {
            this.profileRepository.delete(theProfile);
        }
    }
}
