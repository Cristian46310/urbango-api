package com.jmmg.ms_security.services;

import com.jmmg.ms_security.DTOs.Profile.GetProfileDTO;
import com.jmmg.ms_security.DTOs.Profile.PostProfileDTO;
import com.jmmg.ms_security.models.Profile;
import com.jmmg.ms_security.repositories.IProfileRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ProfileService {
    @Autowired
    private IProfileRepository profileRepository;

    public List<GetProfileDTO> find() {
        return this.profileRepository.findAll().stream().map(GetProfileDTO::fromModel)
                .collect(java.util.stream.Collectors.toList());
    }

    public GetProfileDTO findById(String id) {
        Profile profile = this.profileRepository.findById(id).orElse(null);
        return GetProfileDTO.fromModel(profile);
    }

    public GetProfileDTO create(PostProfileDTO postProfile) {
        Profile newProfile = new Profile(postProfile);
        Profile savedProfile = this.profileRepository.save(newProfile);
        return GetProfileDTO.fromModel(savedProfile);
    }

    public GetProfileDTO update(String id, PostProfileDTO newProfile) {
        Profile actualProfile = this.profileRepository.findById(id).orElse(null);

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
        Profile theProfile = this.profileRepository.findById(id).orElse(null);
        if (theProfile != null) {
            this.profileRepository.delete(theProfile);
        }
    }
}
