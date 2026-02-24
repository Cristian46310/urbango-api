package com.jmmg.ms_security.repositories;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.jmmg.ms_security.models.User;

public interface IUserRepository extends MongoRepository<User, String> {


    public User findByEmail(String email);

}
