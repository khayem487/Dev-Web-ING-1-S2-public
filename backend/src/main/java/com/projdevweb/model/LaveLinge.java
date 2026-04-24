package com.projdevweb.model;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;

@Entity
@DiscriminatorValue("LAVE_LINGE")
public class LaveLinge extends Appareil {

    public LaveLinge() {
        super();
    }

    public LaveLinge(String nom, String marque, Etat etat, Connectivite connectivite,
                     Float batterie, Piece piece, String cycle) {
        super(nom, marque, etat, connectivite, batterie, piece, cycle);
    }
}
