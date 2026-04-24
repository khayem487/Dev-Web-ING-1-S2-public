package com.projdevweb.model;

import jakarta.persistence.Entity;

@Entity
public abstract class Ouvrant extends ObjetConnecte {

    private Integer position;

    protected Ouvrant() {
    }

    protected Ouvrant(String nom, String marque, Etat etat, Connectivite connectivite,
                      Float batterie, Piece piece, Integer position) {
        super(nom, marque, etat, connectivite, batterie, piece);
        this.position = position;
    }

    public Integer getPosition() {
        return position;
    }

    public void setPosition(Integer position) {
        this.position = position;
    }
}
