package com.empresa.sistema.api.dto.response;

import com.empresa.sistema.domain.entity.Client;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClientResponse {

    private Long id;
    private String companyName;
    private String cnpj;
    private String address;
    private String city;
    private String state;
    private String zipCode;
    private String country;
    private String contactPersonName;
    private String contactEmail;
    private String contactPhone;
    private String website;
    private String linkedinUrl;
    private String industry;
    private String companySize;
    private String description;
    private String notes;
    private Client.ClientStatus status;
    private Client.ClientType type;
    private String logoUrl;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}