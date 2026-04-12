package com.empresa.sistema.api.dto.request;

import com.empresa.sistema.domain.entity.Client;
import jakarta.validation.constraints.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClientCreateRequest {

    @NotBlank(message = "Nome da empresa é obrigatório")
    @Size(max = 150, message = "Nome da empresa deve ter no máximo 150 caracteres")
    private String companyName;

    @Pattern(regexp = "\\d{14}", message = "CNPJ deve ter 14 dígitos")
    private String cnpj;

    @Size(max = 200, message = "Endereço deve ter no máximo 200 caracteres")
    private String address;

    @Size(max = 50, message = "Cidade deve ter no máximo 50 caracteres")
    private String city;

    @Size(max = 50, message = "Estado deve ter no máximo 50 caracteres")
    private String state;

    @Pattern(regexp = "\\d{5}-?\\d{3}", message = "CEP deve ter formato válido")
    private String zipCode;

    @Size(max = 50, message = "País deve ter no máximo 50 caracteres")
    private String country;

    @NotBlank(message = "Nome do contato é obrigatório")
    @Size(max = 100, message = "Nome do contato deve ter no máximo 100 caracteres")
    private String contactPersonName;

    @NotBlank(message = "Email de contato é obrigatório")
    @Email(message = "Email deve ser válido")
    @Size(max = 100, message = "Email deve ter no máximo 100 caracteres")
    private String contactEmail;

    @Pattern(regexp = "\\d{10,11}", message = "Telefone deve ter 10 ou 11 dígitos")
    private String contactPhone;

    @Size(max = 100, message = "Website deve ter no máximo 100 caracteres")
    private String website;

    @Size(max = 100, message = "LinkedIn deve ter no máximo 100 caracteres")
    private String linkedinUrl;

    @Size(max = 50, message = "Setor deve ter no máximo 50 caracteres")
    private String industry;

    @Size(max = 20, message = "Tamanho da empresa deve ter no máximo 20 caracteres")
    private String companySize;

    private String description;

    private String notes;

    private Client.ClientType type;

    private String logoUrl;
}