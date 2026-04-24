package com.projdevweb.model;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;

@Entity
@DiscriminatorValue("NOURRITURE")
public class Nourriture extends BesoinAnimal {

    public Nourriture() {
        super();
    }

    public Nourriture(String nom, String marque, Etat etat, Connectivite connectivite,
                      Float batterie, Piece piece, Float niveau, String animal) {
        super(nom, marque, etat, connectivite, batterie, piece, niveau, animal);
    }
}
