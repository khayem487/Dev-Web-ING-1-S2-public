package com.projdevweb.model;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;

@Entity
@DiscriminatorValue("FENETRE")
public class Fenetre extends Ouvrant {

    public Fenetre() {
        super();
    }

    public Fenetre(String nom, String marque, Etat etat, Connectivite connectivite,
                   Float batterie, Piece piece, int position) {
        super(nom, marque, etat, connectivite, batterie, piece, position);
    }
}
