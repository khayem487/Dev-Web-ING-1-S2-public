package com.projdevweb.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AuthRegisterRequest(
        @NotBlank @Size(min = 2, max = 80) String prenom,
        @NotBlank @Size(min = 2, max = 80) String nom,
        @NotBlank @Email String email,
        @NotBlank @Size(min = 4, max = 120) String motDePasse
) {
}
