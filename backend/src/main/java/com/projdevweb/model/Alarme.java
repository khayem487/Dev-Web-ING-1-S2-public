package com.projdevweb.model;

/**
 * Alarme — appareil de sécurité avec état armé/désarmé et détection d'intrusion.
 * Hérite de {@link Appareil}.
 */
public class Alarme extends Appareil {

    public enum StatutAlarme { DESARMEE, ARMEE, ALERTE }

    private StatutAlarme statut = StatutAlarme.DESARMEE;
    private String zones = "Principale";

    public Alarme() {}

    public Alarme(String nom, String marque,Etat etat, Connectivite connectivite, Float batterie, Piece piece) {
        super(nom, marque, etat, connectivite, batterie, piece, "Armée");
    }

    public StatutAlarme getStatut() { return statut; }
    public void setStatut(StatutAlarme statut) { this.statut = statut; }

    public String getZones() { return zones; }
    public void setZones(String zones) { this.zones = zones; }
}