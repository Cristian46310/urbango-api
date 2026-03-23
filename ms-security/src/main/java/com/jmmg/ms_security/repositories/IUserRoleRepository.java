package com.jmmg.ms_security.repositories;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import com.jmmg.ms_security.models.UserRole;

public interface IUserRoleRepository extends MongoRepository<UserRole, String> {

    @Query("{'user.$id': ObjectId(?0)}")
    public List<UserRole> findByUserId(String userId);
}
