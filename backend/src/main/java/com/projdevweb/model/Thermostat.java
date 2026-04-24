package com.projdevweb.model;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;

@Entity
@DiscriminatorValue("THERMOSTAT")
public class Thermostat extends Capteur {

    public Thermostat() {
        super();
    }

    public Thermostat(String nom, String marque, Etat etat, Connectivite connectivite,
                      Float batterie, Piece piece, String zone) {
        super(nom, marque, etat, connectivite, batterie, piece, zone);
    }
}
