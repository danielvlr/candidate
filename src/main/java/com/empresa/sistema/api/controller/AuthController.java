package com.empresa.sistema.api.controller;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.empresa.sistema.api.dto.security.AuthRequestDTO;
import com.empresa.sistema.api.dto.security.JwtResponseDTO;
import com.empresa.sistema.model.db.security.UserInfo;
import com.empresa.sistema.security.JwtService;
import com.empresa.sistema.service.UserService;

@RestController
public class AuthController {
	
	private AuthenticationManager authenticationManager;
	private JwtService jwtService;
	private UserService userService;
	
	public AuthController(AuthenticationManager authenticationManager, JwtService jwtService, UserService userService) {
		this.authenticationManager = authenticationManager;
		this.jwtService = jwtService;
		this.userService = userService;
	}

	@PostMapping("/api/v1/login")
	public JwtResponseDTO AuthenticateAndGetToken(@RequestBody AuthRequestDTO authRequestDTO){
	    Authentication authentication = authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(authRequestDTO.getUsername(), authRequestDTO.getPassword()));

	    if(authentication.isAuthenticated()){
	       return JwtResponseDTO.builder()
	    	        .accessToken(jwtService.GenerateToken(authRequestDTO.getUsername())).build();
	    } else {
	        throw new UsernameNotFoundException("invalid user request..!!");
	    }
	}

	@PostMapping("/api/v1/signup")
	public void userSignUp(@RequestBody AuthRequestDTO authRequestDTO){
		UserInfo userInfo = new UserInfo(null, authRequestDTO.getUsername(), authRequestDTO.getPassword(), null);
		this.userService.addUser(userInfo);
	}

	
//	@PreAuthorize("hasAuthority('ADMIN')")
	@GetMapping("/api/v1/ping")
	public String test() {
	    try {
	        return "Welcome";
	    } catch (Exception e){
	        throw new RuntimeException(e);
	    }
	} 	
}
