package com.projdevweb.model;

import jakarta.persistence.Column;
import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;

import java.time.Instant;

/**
 * Système d'alarme. Trois statuts opérationnels et historique des alertes :
 * <ul>
 *   <li>{@link StatutAlarme#DESARMEE} — pas de surveillance, pas d'alerte</li>
 *   <li>{@link StatutAlarme#ARMEE} — surveillance active, déclenchement possible</li>
 *   <li>{@link StatutAlarme#ALERTE} — intrusion / détection en cours</li>
 * </ul>
 *
 * <p>Le {@code etat} hérité d'ObjetConnecte vaut ACTIF dès que statut ≠ DESARMEE,
 * pour rester cohérent avec le reste de la maison (badges ON/OFF).
 */
@Entity
@DiscriminatorValue("ALARME")
public class Alarme extends Appareil {

    public enum StatutAlarme {
        DESARMEE("Désarmée"),
        ARMEE("Armée"),
        ALERTE("⚠ Alerte intrusion");

        private final String label;
        StatutAlarme(String label) { this.label = label; }
        public String getLabel() { return label; }
    }

    @Enumerated(EnumType.STRING)
    @Column(length = 16)
    private StatutAlarme statut = StatutAlarme.DESARMEE;

    /** Zones surveillées (CSV libre, ex: "Salon, Garage, Hall"). */
    @Column(length = 200)
    private String zones = "Principale";

    /** Dernier déclenchement d'alerte (null si jamais alerté). */
    @Column
    private Instant derniereAlerte;

    /** Code PIN à 4 chiffres pour désarmement rapide (optionnel). */
    @Column(length = 8)
    private String codePin = "0000";

    public Alarme() {
        super();
    }

    public Alarme(String nom, String marque, Etat etat, Connectivite connectivite,
                  Float batterie, Piece piece) {
        super(nom, marque, etat, connectivite, batterie, piece, "Désarmée");
    }

    public StatutAlarme getStatut() {
        return statut;
    }

    public void setStatut(StatutAlarme statut) {
        this.statut = statut == null ? StatutAlarme.DESARMEE : statut;
        // Synchronise l'état générique : armée OU alerte → ACTIF
        setEtat(this.statut == StatutAlarme.DESARMEE ? Etat.INACTIF : Etat.ACTIF);
    }

    public String getZones() {
        return zones;
    }

    public void setZones(String zones) {
        this.zones = zones;
    }

    public Instant getDerniereAlerte() {
        return derniereAlerte;
    }

    public void setDerniereAlerte(Instant derniereAlerte) {
        this.derniereAlerte = derniereAlerte;
    }

    public String getCodePin() {
        return codePin;
    }

    public void setCodePin(String codePin) {
        this.codePin = codePin;
    }

    /** Simule un test : passe en ALERTE 1 fois (l'UI/scheduler peut remettre en ARMEE après). */
    public void declencherAlerte() {
        this.statut = StatutAlarme.ALERTE;
        this.derniereAlerte = Instant.now();
        setEtat(Etat.ACTIF);
    }
}
