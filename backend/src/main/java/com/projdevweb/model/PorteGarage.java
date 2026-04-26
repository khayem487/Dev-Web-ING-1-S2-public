package com.projdevweb.model;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;

@Entity
@DiscriminatorValue("PORTE_GARAGE")
public class PorteGarage extends Ouvrant {

    public PorteGarage() {
        super();
    }

    public PorteGarage(String nom, String marque, Etat etat, Connectivite connectivite,
                       Float batterie, Piece piece, Integer position) {
        super(nom, marque, etat, connectivite, batterie, piece, position);
    }
}
