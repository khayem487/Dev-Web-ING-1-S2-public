package com.projdevweb.dto;

import com.projdevweb.model.DemandeSuppression;
import com.projdevweb.model.DemandeSuppressionStatus;

import java.time.Instant;

public record DemandeSuppressionDTO(
        Long id,
        Long objetId,
        String objetNom,
        Long demandeurId,
        String demandeurEmail,
        String raison,
        DemandeSuppressionStatus status,
        String noteAdmin,
        Instant createdAt,
        Instant resolvedAt,
        String traiteParEmail
) {
    public static DemandeSuppressionDTO from(DemandeSuppression d) {
        return new DemandeSuppressionDTO(
                d.getId(),
                d.getObjet() != null ? d.getObjet().getId() : d.getObjetIdSnapshot(),
                d.getObjet() != null ? d.getObjet().getNom() : d.getObjetNomSnapshot(),
                d.getDemandeur() != null ? d.getDemandeur().getId() : null,
                d.getDemandeur() != null ? d.getDemandeur().getEmail() : null,
                d.getRaison(),
                d.getStatus(),
                d.getNoteAdmin(),
                d.getCreatedAt(),
                d.getResolvedAt(),
                d.getTraitePar() != null ? d.getTraitePar().getEmail() : null
        );
    }
}
