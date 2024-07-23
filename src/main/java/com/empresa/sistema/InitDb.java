package com.empresa.sistema;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.HashSet;
import java.util.Set;

import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.empresa.sistema.model.db.Candidato;
import com.empresa.sistema.model.db.Contato;
import com.empresa.sistema.model.db.security.UserInfo;
import com.empresa.sistema.model.db.security.UserRole;
import com.empresa.sistema.persistence.repository.CandidatoRepository;
import com.empresa.sistema.persistence.repository.ContatoRepository;
import com.empresa.sistema.persistence.repository.UserRepository;
import com.empresa.sistema.persistence.repository.UserRoleRepository;

import lombok.extern.java.Log;

@Log
@Component
public class InitDb implements CommandLineRunner{

	private UserRepository userRepository;
	private UserRoleRepository userRoleRepository;
	private PasswordEncoder passwordEncoder;
	private CandidatoRepository candidatoRepository;
	private ContatoRepository contatoRepository;
	
	public InitDb(UserRepository userRepository, PasswordEncoder passwordEncoder, UserRoleRepository userRoleRepository, CandidatoRepository candidatoRepository, ContatoRepository contatoRepository) {
		this.userRepository = userRepository;
		this.passwordEncoder = passwordEncoder;
		this.userRoleRepository = userRoleRepository;
		this.candidatoRepository = candidatoRepository;
		this.contatoRepository = contatoRepository;
	}


	@Override
	public void run(String... args) throws Exception {
		log.info("inicializando banco");
		
		log.info("criando usuario1:pass");
		UserInfo userInfo = new UserInfo();
		userInfo.setUsername("usuario1");
		userInfo.setPassword(this.passwordEncoder.encode("pass"));
		Set<UserRole> roles =  new HashSet<UserRole>();
		UserRole admin = new UserRole("ADMIN");
		this.userRoleRepository.save(admin);
		roles.add(admin);
		userInfo.setRoles(roles);
		this.userRepository.save(userInfo);

		log.info("criando candidatos");
		this.candidatoRepository.save(new Candidato(null, "DANIEL LEITAO VILAR", "Java Developer and Software Engineer", "Java • Spring Boot • REST APIs • SQL • Microservices", "observações", BigDecimal.valueOf(10000l), "85999999999","https://www.linkedin.com/in/danielvlr", null));
		this.candidatoRepository.save(new Candidato(null, "MARIA HELENA", "ESTUDANTE", "DESENHO", "observacao", BigDecimal.valueOf(1000l), "85999999998","https://www.linkedin.com/in/mhMagaVilar", null));
		Candidato c = this.candidatoRepository.findById(1l).get();
		Contato contato1 = new Contato(null, OffsetDateTime.now(), "JOAO CARLOS", "CONTATO INICIAL");
		this.contatoRepository.save(contato1);
		c.getHistoricoDeContato().add(contato1);
		this.candidatoRepository.save(c);
	}

}
