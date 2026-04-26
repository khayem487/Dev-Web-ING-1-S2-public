package com.projdevweb.dto;

import com.projdevweb.model.ObjetConnecte;

import java.time.Instant;
import java.util.List;

public record MaintenanceItemDTO(
        Long id,
        String nom,
        String type,
        String pieceNom,
        Float batterie,
        String etat,
        Instant derniereMaintenance,
        String severite,
        List<String> raisons
) {

    public static MaintenanceItemDTO from(ObjetConnecte objet,
                                          String severite,
                                          List<String> raisons) {
        return new MaintenanceItemDTO(
                objet.getId(),
                objet.getNom(),
                objet.getClass().getSimpleName(),
                objet.getPiece() != null ? objet.getPiece().getNom() : null,
                objet.getBatterie(),
                objet.getEtat() != null ? objet.getEtat().name() : null,
                objet.getDerniereMaintenance(),
                severite,
                raisons
        );
    }
}
