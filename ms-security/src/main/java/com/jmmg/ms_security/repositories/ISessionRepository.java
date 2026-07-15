package com.jmmg.ms_security.repositories;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.jmmg.ms_security.models.Session;

public interface ISessionRepository extends JpaRepository<Session, UUID> {
}
