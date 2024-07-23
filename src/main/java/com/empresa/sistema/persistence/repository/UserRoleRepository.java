package com.empresa.sistema.persistence.repository;

import org.springframework.data.repository.CrudRepository;

import com.empresa.sistema.model.db.security.UserRole;


public interface UserRoleRepository extends CrudRepository<UserRole, Long> {

}
