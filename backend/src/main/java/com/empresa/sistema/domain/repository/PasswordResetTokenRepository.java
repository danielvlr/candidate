package com.empresa.sistema.domain.repository;

import com.empresa.sistema.domain.entity.PasswordResetToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {

    Optional<PasswordResetToken> findByTokenHash(String tokenHash);

    /** Invalida tokens ainda abertos do usuário (só o último link enviado vale). */
    @Modifying
    @Query("UPDATE PasswordResetToken t SET t.usedAt = :now WHERE t.user.id = :userId AND t.usedAt IS NULL")
    int invalidateOpenTokens(@Param("userId") Long userId, @Param("now") LocalDateTime now);
}
