package com.empresa.sistema.api.dto.response;

import com.empresa.sistema.domain.entity.Client;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClientSummaryResponse {

    private Long id;
    private String companyName;
    private String contactEmail;
    private String contactPhone;
    private String city;
    private String state;
    private String industry;
    private Client.ClientType type;
    private String logoUrl;
}