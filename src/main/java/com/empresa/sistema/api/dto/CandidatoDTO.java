package com.empresa.sistema.api.dto;

import java.util.List;

import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
public class CandidatoDTO {
	private Long id;
	private String nome;
	private String profissao;
	private String habilidades;
	private String observacao;
	private String pretensaoSalarial;
	private String telefone;
	private String linkedin;
	private List<ContatoDTO> historicoDeContato;
}
