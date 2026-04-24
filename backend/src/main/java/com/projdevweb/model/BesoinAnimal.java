package com.projdevweb.model;

import jakarta.persistence.Entity;

@Entity
public abstract class BesoinAnimal extends ObjetConnecte {

    private Float niveau;

    private String animal;

    protected BesoinAnimal() {
    }

    protected BesoinAnimal(String nom, String marque, Etat etat, Connectivite connectivite,
                          Float batterie, Piece piece, Float niveau, String animal) {
        super(nom, marque, etat, connectivite, batterie, piece);
        this.niveau = niveau;
        this.animal = animal;
    }

    public Float getNiveau() {
        return niveau;
    }

    public void setNiveau(Float niveau) {
        this.niveau = niveau;
    }

    public String getAnimal() {
        return animal;
    }

    public void setAnimal(String animal) {
        this.animal = animal;
    }
}
