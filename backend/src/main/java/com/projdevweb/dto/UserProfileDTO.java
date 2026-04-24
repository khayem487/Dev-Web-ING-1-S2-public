package com.projdevweb.dto;

import com.projdevweb.model.Utilisateur;

public record UserProfileDTO(
        Long id,
        String prenom,
        String nom,
        String email,
        String pseudo,
        String bioPublique,
        String telephonePrive,
        String adressePrivee,
        Integer points,
        Integer niveau
) {

    public static UserProfileDTO from(Utilisateur utilisateur) {
        return new UserProfileDTO(
                utilisateur.getId(),
                utilisateur.getPrenom(),
                utilisateur.getNom(),
                utilisateur.getEmail(),
                utilisateur.getPseudo(),
                utilisateur.getBioPublique(),
                utilisateur.getTelephonePrive(),
                utilisateur.getAdressePrivee(),
                utilisateur.getPoints(),
                utilisateur.getNiveau()
        );
    }
}
