package com.empresa.sistema.domain.repository;

import com.empresa.sistema.domain.entity.Client;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ClientRepository extends JpaRepository<Client, Long> {

    Optional<Client> findByCnpj(String cnpj);

    boolean existsByCnpj(String cnpj);

    List<Client> findByStatus(Client.ClientStatus status);

    List<Client> findByType(Client.ClientType type);

    List<Client> findByIndustry(String industry);

    List<Client> findByCity(String city);

    List<Client> findByState(String state);

    @Query("SELECT c FROM Client c WHERE " +
           "(:companyName IS NULL OR LOWER(c.companyName) LIKE LOWER(CONCAT('%', :companyName, '%'))) AND " +
           "(:email IS NULL OR LOWER(c.contactEmail) LIKE LOWER(CONCAT('%', :email, '%'))) AND " +
           "(:city IS NULL OR LOWER(c.city) LIKE LOWER(CONCAT('%', :city, '%'))) AND " +
           "(:industry IS NULL OR LOWER(c.industry) LIKE LOWER(CONCAT('%', :industry, '%'))) AND " +
           "(:status IS NULL OR c.status = :status) AND " +
           "(:type IS NULL OR c.type = :type)")
    Page<Client> findWithFilters(@Param("companyName") String companyName,
                                @Param("email") String email,
                                @Param("city") String city,
                                @Param("industry") String industry,
                                @Param("status") Client.ClientStatus status,
                                @Param("type") Client.ClientType type,
                                Pageable pageable);

    @Query("SELECT c FROM Client c WHERE " +
           "LOWER(c.companyName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(c.contactPersonName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(c.contactEmail) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(c.industry) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(c.city) LIKE LOWER(CONCAT('%', :search, '%'))")
    Page<Client> searchClients(@Param("search") String search, Pageable pageable);

    @Query("SELECT DISTINCT c.city FROM Client c WHERE c.city IS NOT NULL ORDER BY c.city")
    List<String> findAllCities();

    @Query("SELECT DISTINCT c.industry FROM Client c WHERE c.industry IS NOT NULL ORDER BY c.industry")
    List<String> findAllIndustries();

    @Query("SELECT COUNT(c) FROM Client c WHERE c.status = :status")
    long countByStatus(@Param("status") Client.ClientStatus status);

    @Query("SELECT COUNT(c) FROM Client c WHERE c.type = :type")
    long countByType(@Param("type") Client.ClientType type);

    Optional<Client> findByJestorId(String jestorId);
}