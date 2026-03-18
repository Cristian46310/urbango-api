package com.jmmg.ms_security.repositories;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.jmmg.ms_security.models.Profile;

public interface IProfileRepository extends MongoRepository<Profile,String> {

}
