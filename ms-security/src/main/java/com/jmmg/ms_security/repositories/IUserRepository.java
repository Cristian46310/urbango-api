package com.jmmg.ms_security.repositories;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import com.jmmg.ms_security.models.User;

public interface IUserRepository extends MongoRepository<User, String> {

    @Query("{'email': ?0}")
    User findByEmail(String email);

    @Query("{ $or: [ { 'name': { $regex: ?0, $options: 'i' } }, { 'email': { $regex: ?0, $options: 'i' } } ] }")
    Page<User> searchByNameOrEmail(String query, Pageable pageable);
}
