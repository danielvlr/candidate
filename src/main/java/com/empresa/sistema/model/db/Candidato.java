package com.empresa.sistema.model.db;

import java.math.BigDecimal;
import java.util.Set;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
@Entity
@NoArgsConstructor
@AllArgsConstructor
public class Candidato {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(name = "ID")
	private Long id;
	private String nome;
	private String profissao;
	private String habilidades;
	private String observacao;
	private BigDecimal pretensaoSalarial;
	private String telefone;
	private String linkedin;
    @OneToMany(fetch = FetchType.EAGER)
	private Set<Contato> historicoDeContato;
}
