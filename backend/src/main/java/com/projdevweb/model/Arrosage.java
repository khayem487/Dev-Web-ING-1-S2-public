package com.projdevweb.model;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;

@Entity
@DiscriminatorValue("ARROSAGE")
public class Arrosage extends Appareil {

    public Arrosage() {
        super();
    }

    public Arrosage(String nom, String marque, Etat etat, Connectivite connectivite,
                    Float batterie, Piece piece) {
        super(nom, marque, etat, connectivite, batterie, piece, "Auto");
    }
}
