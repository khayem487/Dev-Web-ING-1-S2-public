package com.projdevweb.dto;

import com.projdevweb.model.Etat;
import com.projdevweb.model.ScenarioAction;

public record ScenarioActionDTO(
        Long id,
        Long objetId,
        String objetNom,
        String objetType,
        Etat targetEtat,
        Integer targetPosition
) {
    public static ScenarioActionDTO from(ScenarioAction a) {
        return new ScenarioActionDTO(
                a.getId(),
                a.getObjet() != null ? a.getObjet().getId() : null,
                a.getObjet() != null ? a.getObjet().getNom() : null,
                a.getObjet() != null ? a.getObjet().getClass().getSimpleName() : null,
                a.getTargetEtat(),
                a.getTargetPosition()
        );
    }
}
