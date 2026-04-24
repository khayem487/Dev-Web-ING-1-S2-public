package com.projdevweb.model;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;

@Entity
@DiscriminatorValue("TELEVISION")
public class Television extends Appareil {

    public Television() {
        super();
    }

    public Television(String nom, String marque, Etat etat, Connectivite connectivite,
                      Float batterie, Piece piece, String cycle) {
        super(nom, marque, etat, connectivite, batterie, piece, cycle);
    }
}
