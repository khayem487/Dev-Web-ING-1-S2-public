package com.projdevweb.model;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;

@Entity
@DiscriminatorValue("ENFANT")
public class Enfant extends Utilisateur {

    public Enfant() {
    }

    public Enfant(String prenom, String nom, String email, String motDePasseHash) {
        super(prenom, nom, email, motDePasseHash);
    }

    @Override
    public Niveau getNiveauMax() {
        return TypeMembre.ENFANT.getNiveauMax();
    }

    @Override
    public TypeMembre getTypeMembre() {
        return TypeMembre.ENFANT;
    }
}
