package com.projdevweb.model;

/**
 * Fenêtre connectée — ouvrants avec position 0 (fermée) → 100 (grande ouverte).
 * Hérite de {@link Ouvrant} qui hérite de {@link ObjetConnecte}.
 */
public class Fenetre extends Ouvrant {

    public Fenetre() {}

    public Fenetre(String nom, String marque,Etat etat, Connectivite connectivite, Float batterie, Piece piece, int position) {
        super(nom, marque, etat, connectivite, batterie, piece, position);
    }
}