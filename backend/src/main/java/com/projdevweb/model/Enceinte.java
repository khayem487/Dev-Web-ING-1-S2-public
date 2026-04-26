package com.projdevweb.model;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;

@Entity
@DiscriminatorValue("ENCEINTE")
public class Enceinte extends Appareil {

    public Enceinte() {
        super();
    }

    public Enceinte(String nom, String marque, Etat etat, Connectivite connectivite,
                    Float batterie, Piece piece) {
        super(nom, marque, etat, connectivite, batterie, piece, "Bluetooth");
    }
}
