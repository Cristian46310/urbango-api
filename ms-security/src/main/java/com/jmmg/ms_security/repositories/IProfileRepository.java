package com.jmmg.ms_security.repositories;

import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import com.jmmg.ms_security.models.Profile;

public interface IProfileRepository extends MongoRepository<Profile,String> {
	@Query("{'user.$id': ObjectId(?0)}")
	Optional<Profile> findByUserId(String userId);

}
