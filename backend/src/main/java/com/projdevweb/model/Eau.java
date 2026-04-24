package com.projdevweb.model;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;

@Entity
@DiscriminatorValue("EAU")
public class Eau extends BesoinAnimal {

    public Eau() {
        super();
    }

    public Eau(String nom, String marque, Etat etat, Connectivite connectivite,
               Float batterie, Piece piece, Float niveau, String animal) {
        super(nom, marque, etat, connectivite, batterie, piece, niveau, animal);
    }
}
