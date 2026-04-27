package com.empresa.sistema.api.dto.request;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class SelfRegisterRequest {

    @NotBlank
    private String fullName;

    private String headline;
    private String city;
    private String state;
    private String linkedinUrl;
    private String summary;

    @NotNull
    @AssertTrue
    private Boolean consentAccepted;

    @NotBlank
    private String consentVersion;
}
