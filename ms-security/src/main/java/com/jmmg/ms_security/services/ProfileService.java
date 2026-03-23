package com.jmmg.ms_security.services;

import com.jmmg.ms_security.models.Profile;
import com.jmmg.ms_security.repositories.IProfileRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ProfileService {
    @Autowired
    private IProfileRepository profileRepository;

    public List<Profile> find(){
        return this.profileRepository.findAll();
    }

    public Profile findById(String id){
        Profile theProfile = this.profileRepository.findById(id).orElse(null);
        return theProfile;
    }

    public Profile create(Profile newProfile){
        return this.profileRepository.save(newProfile);
    }

    public Profile update(String id, Profile newProfile){
        Profile actualProfile = this.profileRepository.findById(id).orElse(null);

        if(actualProfile != null){
            actualProfile.setPhone(newProfile.getPhone());
            actualProfile.setPhoto(newProfile.getPhoto());
            this.profileRepository.save(actualProfile);
            return actualProfile;
        } else {
            return null;
        }
    }

    public void delete(String id){
        Profile theProfile = this.profileRepository.findById(id).orElse(null);
        if(theProfile != null){
            this.profileRepository.delete(theProfile);
        }
    }
}
