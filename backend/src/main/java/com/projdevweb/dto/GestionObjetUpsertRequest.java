package com.projdevweb.dto;

import jakarta.validation.constraints.Size;

public record GestionObjetUpsertRequest(
        String type,
        @Size(max = 255) String nom,
        @Size(max = 255) String marque,
        Long pieceId,
        String etat,
        String connectivite,
        Float batterie,
        Integer position,
        @Size(max = 255) String zone,
        @Size(max = 255) String cycle,
        Float consoEnergie,
        Float niveau,
        @Size(max = 255) String animal
) {
}
