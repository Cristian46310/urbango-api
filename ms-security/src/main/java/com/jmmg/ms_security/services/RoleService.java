package com.jmmg.ms_security.services;

import com.jmmg.ms_security.models.Role;
import com.jmmg.ms_security.repositories.IRoleRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class RoleService {

    @Autowired
    private IRoleRepository roleRepository;

    public List<Role> find(){
        return this.roleRepository.findAll();
    }

    public Role findById(String id){
        return this.roleRepository.findById(id).orElse(null);
    }

    public Role create(Role newRole){
        return this.roleRepository.save(newRole);
    }

    public Role update(String id, Role newRole){
        Role actualRole = this.roleRepository.findById(id).orElse(null);

        if(actualRole != null){
            actualRole.setName(newRole.getName());
            actualRole.setDescription(newRole.getDescription());
            this.roleRepository.save(actualRole);
            return actualRole;
        } else {
            return null;
        }
    }

    public void delete(String id){
        Role theRole = this.roleRepository.findById(id).orElse(null);
        if(theRole != null){
            this.roleRepository.delete(theRole);
        }
    }
}
