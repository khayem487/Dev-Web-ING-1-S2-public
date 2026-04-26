package com.projdevweb.model;

/**
 * Détecteur de mouvement — capte une présence et remonte un événement.
 * Hérite de {@link Capteur}.
 */
public class DetecteurMouvement extends Capteur {

    public DetecteurMouvement() {}

    public DetecteurMouvement(String nom, String marque,Etat etat, Connectivite connectivite, Float batterie, Piece piece, String zone) {
        super(nom, marque, etat, connectivite, batterie, piece, zone);
    }
}