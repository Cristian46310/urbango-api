package com.jmmg.ms_security.repositories;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.jmmg.ms_security.models.Role;

public interface IRoleRepository extends MongoRepository<Role, String> {
}
