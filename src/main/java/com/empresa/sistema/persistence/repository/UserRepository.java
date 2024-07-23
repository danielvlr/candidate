package com.empresa.sistema.persistence.repository;

import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

import com.empresa.sistema.model.db.security.UserInfo;

@Repository
public interface UserRepository extends CrudRepository<UserInfo, Long> {
   public UserInfo findByUsername(String username);
}