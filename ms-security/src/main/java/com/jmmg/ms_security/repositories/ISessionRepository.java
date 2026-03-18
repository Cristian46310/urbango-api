package com.jmmg.ms_security.repositories;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.jmmg.ms_security.models.Session;

public interface ISessionRepository  extends MongoRepository<Session,String> {
}
