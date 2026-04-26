package com.projdevweb.dto;

import com.projdevweb.model.Niveau;
import com.projdevweb.model.TypeMembre;
import com.projdevweb.model.Utilisateur;

import java.time.Instant;
import java.time.LocalDate;

/**
 * Snapshot complet du profil utilisateur exposé au front.
 * Inclut les champs publics, les champs privés (l'utilisateur consulte son propre profil),
 * la progression (points/niveau/niveauMax) et la traçabilité (nbConnexions, dateInscription).
 */
public record UserProfileDTO(
        Long id,
        String prenom,
        String nom,
        String email,
        String pseudo,
        String bioPublique,
        String telephonePrive,
        String adressePrivee,
        String genre,
        LocalDate dateNaissance,
        String ville,
        String photoDataUrl,
        Float points,
        Niveau niveau,
        Niveau niveauMax,
        TypeMembre typeMembre,
        boolean admin,
        Integer nbConnexions,
        Instant dateInscription
) {

    public static UserProfileDTO from(Utilisateur u) {
        return new UserProfileDTO(
                u.getId(),
                u.getPrenom(),
                u.getNom(),
                u.getEmail(),
                u.getPseudo(),
                u.getBioPublique(),
                u.getTelephonePrive(),
                u.getAdressePrivee(),
                u.getGenre(),
                u.getDateNaissance(),
                u.getVille(),
                u.getPhotoDataUrl(),
                u.getPoints(),
                u.getNiveau(),
                u.getNiveauMax(),
                u.getTypeMembre(),
                u.isAdmin(),
                u.getNbConnexions(),
                u.getDateInscription()
        );
    }
}
