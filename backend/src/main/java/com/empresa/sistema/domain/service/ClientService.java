package com.empresa.sistema.domain.service;

import com.empresa.sistema.api.dto.request.ClientCreateRequest;
import com.empresa.sistema.api.dto.request.ClientUpdateRequest;
import com.empresa.sistema.api.dto.response.ClientResponse;
import com.empresa.sistema.api.mapper.ClientMapper;
import com.empresa.sistema.domain.entity.Client;
import com.empresa.sistema.domain.repository.ClientRepository;
import com.empresa.sistema.domain.service.exception.ResourceNotFoundException;
import com.empresa.sistema.domain.service.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
@RequiredArgsConstructor
public class ClientService {

    private final ClientRepository clientRepository;
    private final ClientMapper clientMapper;

    @Transactional(readOnly = true)
    public Page<ClientResponse> findAll(Pageable pageable) {
        Page<Client> clients = clientRepository.findAll(pageable);
        return clients.map(clientMapper::toResponse);
    }

    @Transactional(readOnly = true)
    public ClientResponse findById(Long id) {
        Client client = clientRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Cliente não encontrado com ID: " + id));
        return clientMapper.toResponse(client);
    }

    @Transactional(readOnly = true)
    public ClientResponse findByCnpj(String cnpj) {
        Client client = clientRepository.findByCnpj(cnpj)
            .orElseThrow(() -> new ResourceNotFoundException("Cliente não encontrado com CNPJ: " + cnpj));
        return clientMapper.toResponse(client);
    }

    @Transactional(readOnly = true)
    public Page<ClientResponse> searchClients(String search, Pageable pageable) {
        Page<Client> clients = clientRepository.searchClients(search, pageable);
        return clients.map(clientMapper::toResponse);
    }

    @Transactional(readOnly = true)
    public Page<ClientResponse> findWithFilters(String companyName, String email, String city,
                                               String industry, Client.ClientStatus status,
                                               Client.ClientType type, Pageable pageable) {
        if (status == null) {
            status = Client.ClientStatus.ACTIVE;
        }
        Page<Client> clients = clientRepository.findWithFilters(
            companyName, email, city, industry, status, type, pageable);
        return clients.map(clientMapper::toResponse);
    }

    @Transactional(readOnly = true)
    public List<String> getAllCities() {
        return clientRepository.findAllCities();
    }

    @Transactional(readOnly = true)
    public List<String> getAllIndustries() {
        return clientRepository.findAllIndustries();
    }

    @Transactional(readOnly = true)
    public List<ClientResponse> findByStatus(Client.ClientStatus status) {
        List<Client> clients = clientRepository.findByStatus(status);
        return clientMapper.toResponseList(clients);
    }

    @Transactional(readOnly = true)
    public List<ClientResponse> findByType(Client.ClientType type) {
        List<Client> clients = clientRepository.findByType(type);
        return clientMapper.toResponseList(clients);
    }

    @Transactional(readOnly = true)
    public List<ClientResponse> findByIndustry(String industry) {
        List<Client> clients = clientRepository.findByIndustry(industry);
        return clientMapper.toResponseList(clients);
    }

    public ClientResponse create(ClientCreateRequest request) {
        // Verificar se CNPJ já existe (se informado)
        if (request.getCnpj() != null && clientRepository.existsByCnpj(request.getCnpj())) {
            throw new BusinessException("Já existe um cliente cadastrado com este CNPJ: " + request.getCnpj());
        }

        Client client = clientMapper.toEntity(request);

        // Set default values
        if (client.getStatus() == null) {
            client.setStatus(Client.ClientStatus.ACTIVE);
        }

        if (client.getCountry() == null || client.getCountry().isEmpty()) {
            client.setCountry("Brasil");
        }

        Client savedClient = clientRepository.save(client);
        return clientMapper.toResponse(savedClient);
    }

    public ClientResponse update(Long id, ClientUpdateRequest request) {
        Client existingClient = clientRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Cliente não encontrado com ID: " + id));

        // Verificar se email já existe (exceto para o próprio cliente)
        if (request.getContactEmail() != null &&
            !existingClient.getContactEmail().equals(request.getContactEmail())) {
            throw new BusinessException("Já existe um cliente cadastrado com este email: " + request.getContactEmail());
        }

        // Verificar se CNPJ já existe (exceto para o próprio cliente)
        if (request.getCnpj() != null &&
            !request.getCnpj().equals(existingClient.getCnpj()) &&
            clientRepository.existsByCnpj(request.getCnpj())) {
            throw new BusinessException("Já existe um cliente cadastrado com este CNPJ: " + request.getCnpj());
        }

        // Usar MapStruct para atualizar apenas campos não nulos
        clientMapper.updateEntityFromRequest(request, existingClient);

        Client updatedClient = clientRepository.save(existingClient);
        return clientMapper.toResponse(updatedClient);
    }

    public void delete(Long id) {
        Client client = clientRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Cliente não encontrado com ID: " + id));

        // Soft delete - marcar como inativo ao invés de excluir
        client.setStatus(Client.ClientStatus.INACTIVE);
        clientRepository.save(client);
    }

    public void activate(Long id) {
        Client client = clientRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Cliente não encontrado com ID: " + id));

        client.setStatus(Client.ClientStatus.ACTIVE);
        clientRepository.save(client);
    }

    public void suspend(Long id) {
        Client client = clientRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Cliente não encontrado com ID: " + id));

        client.setStatus(Client.ClientStatus.SUSPENDED);
        clientRepository.save(client);
    }

    @Transactional(readOnly = true)
    public long countByStatus(Client.ClientStatus status) {
        return clientRepository.countByStatus(status);
    }

    @Transactional(readOnly = true)
    public long countByType(Client.ClientType type) {
        return clientRepository.countByType(type);
    }

    @Transactional(readOnly = true)
    public boolean existsByCnpj(String cnpj) {
        return clientRepository.existsByCnpj(cnpj);
    }
}