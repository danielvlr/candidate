package com.empresa.sistema.persistence.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.empresa.sistema.model.db.Contato;

@Repository
public interface ContatoRepository extends JpaRepository<Contato, Long> {
}