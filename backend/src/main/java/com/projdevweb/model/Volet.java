package com.projdevweb.model;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;

@Entity
@DiscriminatorValue("VOLET")
public class Volet extends Ouvrant {

    public Volet() {
        super();
    }

    public Volet(String nom, String marque, Etat etat, Connectivite connectivite,
                 Float batterie, Piece piece, Integer position) {
        super(nom, marque, etat, connectivite, batterie, piece, position);
    }
}
