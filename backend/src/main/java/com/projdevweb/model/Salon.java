package com.projdevweb.model;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;

@Entity
@DiscriminatorValue("SALON")
public class Salon extends Piece {

    public Salon() {
        super();
    }

    public Salon(String nom, Maison maison) {
        super(nom, maison);
    }
}
