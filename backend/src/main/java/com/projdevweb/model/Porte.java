package com.projdevweb.model;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;

@Entity
@DiscriminatorValue("PORTE")
public class Porte extends Ouvrant {

    public Porte() {
        super();
    }

    public Porte(String nom, String marque, Etat etat, Connectivite connectivite,
                 Float batterie, Piece piece, Integer position) {
        super(nom, marque, etat, connectivite, batterie, piece, position);
    }
}
