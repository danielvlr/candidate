package com.empresa.sistema.persistence.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.empresa.sistema.model.db.Candidato;

@Repository
public interface CandidatoRepository extends JpaRepository<Candidato, Long> {
	@Query("SELECT c FROM Candidato c WHERE "
			+ "upper(c.nome) LIKE CONCAT('%',:texto,'%') "
			+ "or upper(c.profissao) LIKE CONCAT('%',:texto,'%') "
			+ "or upper(c.habilidades) LIKE CONCAT('%',:texto,'%') "
			+ "or upper(c.observacao) LIKE CONCAT('%',:texto,'%')")
	Page<Candidato> findCandidatoPorTexto(@Param("texto") String texto, Pageable pageable);

}