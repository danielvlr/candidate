package com.empresa.sistema.api.dto;

import java.time.OffsetDateTime;

import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
public class ContatoDTO {
	private Long id;
	private OffsetDateTime data;
	private String headhunter;
	private String descricao;
}
