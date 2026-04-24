package com.projdevweb.dto;

import com.projdevweb.model.GestionHistorique;

import java.time.Instant;

public record GestionHistoriqueDTO(
        Long id,
        Instant timestamp,
        String action,
        Long objetId,
        String objetNom,
        String typeObjet,
        String pieceNom,
        String utilisateurEmail,
        String details
) {
    public static GestionHistoriqueDTO from(GestionHistorique h) {
        return new GestionHistoriqueDTO(
                h.getId(),
                h.getTimestamp(),
                h.getAction(),
                h.getObjetId(),
                h.getObjetNom(),
                h.getTypeObjet(),
                h.getPieceNom(),
                h.getUtilisateurEmail(),
                h.getDetails()
        );
    }
}
