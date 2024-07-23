package com.empresa.sistema.service;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.empresa.sistema.model.db.security.UserInfo;
import com.empresa.sistema.persistence.repository.UserRepository;
import com.empresa.sistema.persistence.repository.UserRoleRepository;

@Service
public class UserService {
	private UserRepository userRepository;
	private UserRoleRepository userRoleRepository;
	private PasswordEncoder passwordEncoder;
	
	
	public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder, UserRoleRepository userRoleRepository) {
		this.userRepository = userRepository;
		this.passwordEncoder = passwordEncoder;
		this.userRoleRepository = userRoleRepository;
	}	
	public UserInfo addUser(UserInfo userInfo) {
		if(userInfo==null||userInfo.getUsername()==null||userInfo.getPassword()==null) {
			throw new RuntimeException("usuário inválido");
		}
		userInfo.setPassword(passwordEncoder.encode(userInfo.getPassword()));
		this.userRepository.save(userInfo);
		return userInfo;
	}
}
