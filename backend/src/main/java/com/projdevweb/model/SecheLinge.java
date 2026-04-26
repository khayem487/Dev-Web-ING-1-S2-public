package com.projdevweb.model;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;

@Entity
@DiscriminatorValue("SECHE_LINGE")
public class SecheLinge extends Appareil {

    public SecheLinge() {
        super();
    }

    public SecheLinge(String nom, String marque, Etat etat, Connectivite connectivite,
                      Float batterie, Piece piece) {
        super(nom, marque, etat, connectivite, batterie, piece, "Cotton" );
    }
}
