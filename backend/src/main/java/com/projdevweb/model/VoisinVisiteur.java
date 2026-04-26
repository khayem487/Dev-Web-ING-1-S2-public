package com.projdevweb.model;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;

@Entity
@DiscriminatorValue("VOISIN_VISITEUR")
public class VoisinVisiteur extends Utilisateur {

    public VoisinVisiteur() {
    }

    public VoisinVisiteur(String prenom, String nom, String email, String motDePasseHash) {
        super(prenom, nom, email, motDePasseHash);
    }

    @Override
    public Niveau getNiveauMax() {
        return TypeMembre.VOISIN_VISITEUR.getNiveauMax();
    }

    @Override
    public TypeMembre getTypeMembre() {
        return TypeMembre.VOISIN_VISITEUR;
    }
}
