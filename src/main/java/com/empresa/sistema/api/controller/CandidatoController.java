package com.empresa.sistema.api.controller;

import java.util.List;

import org.springframework.beans.BeanUtils;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.empresa.sistema.api.dto.CandidatoDTO;
import com.empresa.sistema.model.db.Candidato;
import com.empresa.sistema.persistence.repository.CandidatoRepository;
import com.empresa.sistema.util.MapUtil;

@Validated
@RestController
public class CandidatoController {
	
	
	private CandidatoRepository candidatoRepository;

	public CandidatoController(CandidatoRepository candidatoRepository) {
		this.candidatoRepository = candidatoRepository;
	}

	@GetMapping("/api/v1/candidato")
	public Page<CandidatoDTO> getCandidatos(@RequestParam String q, Pageable pageable) {
		Page<Candidato> page = this.candidatoRepository.findCandidatoPorTexto(q!=null?q.toUpperCase():"", pageable);
		return MapUtil.mapPage(page, CandidatoDTO.class);
	}

    @GetMapping("/api/v1/candidato/{id}")
	public CandidatoDTO getCandidatos(@PathVariable Long id) {
		Candidato candidato = this.candidatoRepository.findById(id).orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND));
		return MapUtil.mapObject(candidato, CandidatoDTO.class);
	}

	@PostMapping("/api/v1/candidato/")
	public CandidatoDTO inserirCandidato(@RequestBody CandidatoDTO candidatoDTO) {
		Candidato candidato = MapUtil.mapObject(candidatoDTO, Candidato.class);
		candidato = this.candidatoRepository.save(candidato);
		return MapUtil.mapObject(candidato, CandidatoDTO.class);
	}

	@PutMapping("/api/v1/candidato/{id}")
	public CandidatoDTO alterarCandidato(@PathVariable long id, @RequestBody CandidatoDTO candidatoDTO) {
		if(candidatoDTO==null) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST);
		}
		
		Candidato candidato = this.candidatoRepository.findById(id).orElseThrow(()->{
			return new ResponseStatusException(HttpStatus.NOT_FOUND);
		});
		
		BeanUtils.copyProperties(candidatoDTO, candidato, "id", "historicoDeContato");
		candidato = this.candidatoRepository.save(candidato);
		return MapUtil.mapObject(candidato, CandidatoDTO.class);
	}

	@DeleteMapping("/api/v1/candidato/{id}")
	public void excluirCandidato(@PathVariable Long id) {		
		Candidato candidato = this.candidatoRepository.findById(id).orElseThrow(()->{
			return new ResponseStatusException(HttpStatus.NOT_FOUND);
		});
		this.candidatoRepository.delete(candidato);
	}
}
