package com.projdevweb.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Payload register : on accepte un {@code typeMembre} optionnel
 * (par défaut {@code PARENT_FAMILLE} pour faciliter la démo, mais l'API
 * sait créer aussi {@code ENFANT} et {@code VOISIN_VISITEUR}).
 */
public record AuthRegisterRequest(
        @NotBlank @Size(min = 2, max = 80) String prenom,
        @NotBlank @Size(min = 2, max = 80) String nom,
        @NotBlank @Email String email,
        @NotBlank @Size(min = 4, max = 120) String motDePasse,
        String typeMembre
) {
}
