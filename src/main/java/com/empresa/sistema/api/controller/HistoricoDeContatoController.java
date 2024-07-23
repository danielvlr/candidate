package com.empresa.sistema.api.controller;

import java.util.Set;

import org.springframework.beans.BeanUtils;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.empresa.sistema.api.dto.ContatoDTO;
import com.empresa.sistema.api.dto.PatchRequest;
import com.empresa.sistema.model.db.Candidato;
import com.empresa.sistema.model.db.Contato;
import com.empresa.sistema.persistence.repository.CandidatoRepository;
import com.empresa.sistema.persistence.repository.ContatoRepository;
import com.empresa.sistema.util.MapUtil;

@RestController
public class HistoricoDeContatoController {
	private CandidatoRepository candidatoRepository;
	private ContatoRepository contatoRepository;

	public HistoricoDeContatoController(CandidatoRepository candidatoRepository, ContatoRepository contatoRepository) {
		this.candidatoRepository = candidatoRepository;
		this.contatoRepository = contatoRepository;
	}

	@GetMapping("/api/v1/candidato/{id}/historico-de-contato")
	public Set<ContatoDTO> getHistoricoDeContato(@PathVariable Long id) {
		Candidato candidato = this.candidatoRepository.findById(id).orElseThrow(() -> {
			return new ResponseStatusException(HttpStatus.NOT_FOUND);
		});
		Set<ContatoDTO> historicoDeContatoDTO = MapUtil.mapSet(candidato.getHistoricoDeContato(), ContatoDTO.class);
		return historicoDeContatoDTO;
	}

	@PostMapping("/api/v1/candidato/{id}/historico-de-contato/")
	public ContatoDTO addHistoricoDeContato(@PathVariable Long id, @RequestBody ContatoDTO contatoDTO) {
		Candidato candidato = this.candidatoRepository.findById(id).orElseThrow(() -> {
			return new ResponseStatusException(HttpStatus.NOT_FOUND);
		});
		Contato c = MapUtil.mapObject(contatoDTO, Contato.class);
		this.contatoRepository.save(c);
		candidato.getHistoricoDeContato().add(c);
		this.candidatoRepository.save(candidato);


		return MapUtil.mapObject(c, ContatoDTO.class);
	}

	@DeleteMapping("/api/v1/candidato/{id}/historico-de-contato/{idContato}")
	public void deleteHistoricoDeContato(@PathVariable Long id, @PathVariable Long idContato) {
		Candidato candidato = this.candidatoRepository.findById(id).orElseThrow(() -> {
			return new ResponseStatusException(HttpStatus.NOT_FOUND);
		});

		Contato contato = candidato.getHistoricoDeContato().stream().filter(c -> c.getId().equals(idContato))
				.findFirst().orElseThrow(() -> {
					return new ResponseStatusException(HttpStatus.NOT_FOUND);
				});
		candidato.getHistoricoDeContato().remove(contato);
		this.candidatoRepository.save(candidato);
		this.contatoRepository.delete(contato);
	}
	
	@PatchMapping("/api/v1/candidato/{id}/historico-de-contato/")
	public void patchHistoricoDeContato(@PathVariable Long id, @RequestBody PatchRequest<ContatoDTO> patchRequest) {
		Candidato candidato = this.candidatoRepository.findById(id).orElseThrow(() -> {
			return new ResponseStatusException(HttpStatus.NOT_FOUND);
		});
		//inserindo
		patchRequest.getInserts().stream().forEach(contatoDTO->{
			Contato contato = MapUtil.mapObject(contatoDTO, Contato.class);
			contato = this.contatoRepository.save(contato);
			candidato.getHistoricoDeContato().add(contato);
		});
		//excluindo
		patchRequest.getDeletes().stream().forEach(contatoDTO->{
			 Contato contato = candidato.getHistoricoDeContato().stream().filter(c -> c.getId().equals(contatoDTO.getId()))
					.findFirst().orElseThrow(() -> {
						return new ResponseStatusException(HttpStatus.NOT_FOUND);
					});
			candidato.getHistoricoDeContato().remove(contato);
			this.contatoRepository.delete(contato);
		});
		//alterando
		patchRequest.getUpdates().stream().forEach(contatoDTO->{
			Contato contato = candidato.getHistoricoDeContato().stream().filter(c -> c.getId().equals(contatoDTO.getId()))
					.findFirst().orElseThrow(() -> {
						return new ResponseStatusException(HttpStatus.NOT_FOUND);
					});
			BeanUtils.copyProperties(contatoDTO, contato, "id");
			this.contatoRepository.save(contato);
		});
		this.candidatoRepository.save(candidato);

	}
}
