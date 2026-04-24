package com.projdevweb.model;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;

@Entity
@DiscriminatorValue("CAMERA")
public class Camera extends Capteur {

    public Camera() {
        super();
    }

    public Camera(String nom, String marque, Etat etat, Connectivite connectivite,
                  Float batterie, Piece piece, String zone) {
        super(nom, marque, etat, connectivite, batterie, piece, zone);
    }
}
