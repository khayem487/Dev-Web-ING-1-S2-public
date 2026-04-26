package com.projdevweb.model;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;

@Entity
@DiscriminatorValue("PARENT_FAMILLE")
public class ParentFamille extends Utilisateur {

    public ParentFamille() {
    }

    public ParentFamille(String prenom, String nom, String email, String motDePasseHash) {
        super(prenom, nom, email, motDePasseHash);
    }

    @Override
    public Niveau getNiveauMax() {
        return TypeMembre.PARENT_FAMILLE.getNiveauMax();
    }

    @Override
    public TypeMembre getTypeMembre() {
        return TypeMembre.PARENT_FAMILLE;
    }
}
