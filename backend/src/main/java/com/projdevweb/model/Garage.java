package com.projdevweb.model;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;

@Entity
@DiscriminatorValue("GARAGE")
public class Garage extends Piece {

    public Garage() {
        super();
    }

    public Garage(String nom, Maison maison) {
        super(nom, maison);
    }
}
