package com.projdevweb.model;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;

@Entity
@DiscriminatorValue("MACHINE_CAFE")
public class MachineCafe extends Appareil {

    public MachineCafe() {
        super();
    }

    public MachineCafe(String nom, String marque, Etat etat, Connectivite connectivite,
                       Float batterie, Piece piece) {
        super(nom, marque, etat, connectivite, batterie, piece, "Veille");
    }
}
