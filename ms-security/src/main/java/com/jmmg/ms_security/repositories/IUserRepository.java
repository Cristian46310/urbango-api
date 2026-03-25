package com.jmmg.ms_security.repositories;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.security.core.userdetails.UserDetails;

import com.jmmg.ms_security.models.User;

public interface IUserRepository extends MongoRepository<User, String> {

    @Query("{'email': ?0}")
    User findByEmail(String email);
    @Query("{'email': ?0}")
    UserDetails getUserDetailsByEmail(String email);

    

}
