package com.empresa.sistema.model.db;

import java.time.OffsetDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
@Entity
@AllArgsConstructor
@NoArgsConstructor
public class Contato {
	@Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(name = "ID")	
	private Long id;
	private OffsetDateTime data;
	private String headhunter;
	private String descricao;
}
