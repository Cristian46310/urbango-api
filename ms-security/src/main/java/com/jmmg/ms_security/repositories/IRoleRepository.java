package com.jmmg.ms_security.repositories;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.jmmg.ms_security.models.Role;

public interface IRoleRepository extends JpaRepository<Role, UUID> {

    List<Role> findByIdIn(Collection<UUID> ids);

    List<Role> findByNameIn(Collection<String> names);

    Optional<Role> findByName(String name);
}
