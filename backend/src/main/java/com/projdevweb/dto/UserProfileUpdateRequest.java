package com.projdevweb.dto;

import jakarta.validation.constraints.Size;

public record UserProfileUpdateRequest(
        @Size(max = 120) String pseudo,
        @Size(max = 1000) String bioPublique,
        @Size(max = 40) String telephonePrive,
        @Size(max = 500) String adressePrivee
) {
}
