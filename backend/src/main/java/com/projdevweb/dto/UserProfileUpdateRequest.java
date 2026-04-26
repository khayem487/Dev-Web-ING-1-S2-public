package com.projdevweb.dto;

import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record UserProfileUpdateRequest(
        @Size(max = 120) String pseudo,
        @Size(max = 1000) String bioPublique,
        @Size(max = 40) String telephonePrive,
        @Size(max = 500) String adressePrivee,
        @Size(max = 32) String genre,
        LocalDate dateNaissance,
        @Size(max = 120) String ville
) {
}
