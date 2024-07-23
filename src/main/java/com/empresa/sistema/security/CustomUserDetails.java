package com.empresa.sistema.security;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import com.empresa.sistema.model.db.security.UserInfo;
import com.empresa.sistema.model.db.security.UserRole;

public class CustomUserDetails implements UserDetails {

	private static final long serialVersionUID = 1L;
	private UserInfo userInfo;

	public CustomUserDetails(UserInfo userInfo) {
		this.userInfo = userInfo;
	}
	
	@Override
	public Collection<? extends GrantedAuthority> getAuthorities() {
	    List<GrantedAuthority> authorities = new ArrayList<GrantedAuthority>();
	    for(UserRole role : this.userInfo.getRoles()){
	    	GrantedAuthority authority = new SimpleGrantedAuthority(role.getName().toUpperCase());
	    	authorities.add(authority);
        }
        
		return authorities;
	}

	@Override
	public String getPassword() {
		return this.userInfo.getPassword();
	}

	@Override
	public String getUsername() {
		return this.userInfo.getUsername();
	}

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }

}
