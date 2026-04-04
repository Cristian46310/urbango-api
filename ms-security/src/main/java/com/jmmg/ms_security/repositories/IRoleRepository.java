package com.jmmg.ms_security.repositories;

import java.util.Collection;
import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.jmmg.ms_security.models.Role;

public interface IRoleRepository extends MongoRepository<Role, String> {

    List<Role> findByIdIn(Collection<String> ids);
}
