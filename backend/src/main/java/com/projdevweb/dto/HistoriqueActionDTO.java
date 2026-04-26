package com.projdevweb.dto;

import com.projdevweb.model.ActionType;
import com.projdevweb.model.HistoriqueAction;
import com.projdevweb.model.ObjetConnecte;
import com.projdevweb.model.Utilisateur;

import java.time.Instant;

/**
 * Vue front d'une trace d'action.
 *
 * <p>Comme l'objet et l'utilisateur sont des FKs, on aplatit les champs nécessaires
 * et on tombe sur le snapshot ({@code objetNomSnapshot}) si la FK objet est nulle
 * (objet supprimé).
 */
public record HistoriqueActionDTO(
        Long id,
        Instant timestamp,
        ActionType action,
        Long utilisateurId,
        String utilisateurEmail,
        String utilisateurPrenom,
        Long objetId,
        String objetNom,
        String objetType,
        String details
) {
    public static HistoriqueActionDTO from(HistoriqueAction h) {
        Utilisateur u = h.getUtilisateur();
        ObjetConnecte o = h.getObjet();
        return new HistoriqueActionDTO(
                h.getId(),
                h.getTimestamp(),
                h.getAction(),
                u != null ? u.getId() : null,
                u != null ? u.getEmail() : null,
                u != null ? u.getPrenom() : null,
                o != null ? o.getId() : null,
                o != null ? o.getNom() : h.getObjetNomSnapshot(),
                o != null ? o.getClass().getSimpleName() : h.getObjetTypeSnapshot(),
                h.getDetails()
        );
    }
}
