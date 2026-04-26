package com.projdevweb.model;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;

@Entity
@DiscriminatorValue("REVEIL")
public class Reveil extends Appareil {

    public Reveil() {
        super();
    }

    public Reveil(String nom, String marque, Etat etat, Connectivite connectivite,
                  Float batterie, Piece piece) {
        super(nom, marque, etat, connectivite, batterie, piece, "Programme");
    }
}
