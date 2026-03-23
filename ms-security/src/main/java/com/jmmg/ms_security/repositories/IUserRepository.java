package com.jmmg.ms_security.repositories;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import com.jmmg.ms_security.models.User;

public interface IUserRepository extends MongoRepository<User, String> {

    @Query("{'email': ?0}")
    public User findByEmail(String email);

}
