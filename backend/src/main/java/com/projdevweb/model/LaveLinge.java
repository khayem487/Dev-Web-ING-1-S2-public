package com.projdevweb.model;

import jakarta.persistence.Column;
import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;

import java.time.Duration;
import java.time.Instant;

/**
 * Lave-linge avec contrôle à distance type produit smart-home :
 * <ul>
 *   <li>{@code programme} — préset utilisateur (Eco 40°C, Coton 60°C, …) listé dans {@link ProgrammeLavage}</li>
 *   <li>{@code tempLavage} — température en °C (override possible du programme)</li>
 *   <li>{@code vitesseEssorage} — tours/min (400, 800, 1200, 1600)</li>
 *   <li>{@code dateDebutCycle} — quand le cycle a démarré (null si à l'arrêt)</li>
 *   <li>{@code dureeProgrammeMin} — durée totale prévue du cycle en minutes</li>
 * </ul>
 *
 * <p>Le temps restant ({@link #computeDureeRestante()}) est calculé à la volée par
 * différence entre {@code dateDebutCycle + dureeProgrammeMin} et l'instant courant —
 * pas stocké. Cycle terminé ou pas démarré → renvoie {@code null}.
 */
@Entity
@DiscriminatorValue("LAVE_LINGE")
public class LaveLinge extends Appareil {

    /** Catalogue produit. Chaque programme = (durée, température suggérée, essorage suggéré). */
    public enum ProgrammeLavage {
        ECO_40("Eco 40°C", 120, 40, 1000),
        COTON_60("Coton 60°C", 150, 60, 1400),
        EXPRESS_30("Express 30°C", 30, 30, 1200),
        SYNTH_30("Synthétique 30°C", 90, 30, 800),
        DELICAT("Délicat 20°C", 60, 20, 600),
        RINCAGE("Rinçage", 25, 30, 1000),
        ESSORAGE("Essorage seul", 15, 0, 1400);

        private final String label;
        private final int dureeMin;
        private final int tempSuggeree;
        private final int essorageSuggere;

        ProgrammeLavage(String label, int dureeMin, int tempSuggeree, int essorageSuggere) {
            this.label = label;
            this.dureeMin = dureeMin;
            this.tempSuggeree = tempSuggeree;
            this.essorageSuggere = essorageSuggere;
        }

        public String getLabel() { return label; }
        public int getDureeMin() { return dureeMin; }
        public int getTempSuggeree() { return tempSuggeree; }
        public int getEssorageSuggere() { return essorageSuggere; }
    }

    @Column(length = 32)
    private String programme;

    @Column
    private Integer tempLavage;

    @Column
    private Integer vitesseEssorage;

    @Column
    private Instant dateDebutCycle;

    @Column
    private Integer dureeProgrammeMin;

    public LaveLinge() {
        super();
    }

    public LaveLinge(String nom, String marque, Etat etat, Connectivite connectivite,
                     Float batterie, Piece piece, String cycle) {
        super(nom, marque, etat, connectivite, batterie, piece, cycle);
        // Défauts produit raisonnables
        this.programme = ProgrammeLavage.COTON_60.name();
        this.tempLavage = ProgrammeLavage.COTON_60.getTempSuggeree();
        this.vitesseEssorage = ProgrammeLavage.COTON_60.getEssorageSuggere();
    }

    public String getProgramme() { return programme; }
    public void setProgramme(String programme) { this.programme = programme; }

    public Integer getTempLavage() { return tempLavage; }
    public void setTempLavage(Integer tempLavage) { this.tempLavage = tempLavage; }

    public Integer getVitesseEssorage() { return vitesseEssorage; }
    public void setVitesseEssorage(Integer vitesseEssorage) { this.vitesseEssorage = vitesseEssorage; }

    public Instant getDateDebutCycle() { return dateDebutCycle; }
    public void setDateDebutCycle(Instant dateDebutCycle) { this.dateDebutCycle = dateDebutCycle; }

    public Integer getDureeProgrammeMin() { return dureeProgrammeMin; }
    public void setDureeProgrammeMin(Integer dureeProgrammeMin) { this.dureeProgrammeMin = dureeProgrammeMin; }

    /**
     * Lance un cycle : enregistre le moment de départ et la durée prévue.
     * À appliquer côté contrôleur quand l'utilisateur clique « Lancer cycle ».
     */
    public void demarrerCycle() {
        this.dateDebutCycle = Instant.now();
        if (this.programme != null) {
            try {
                ProgrammeLavage prog = ProgrammeLavage.valueOf(this.programme);
                this.dureeProgrammeMin = prog.getDureeMin();
            } catch (IllegalArgumentException ex) {
                // programme libre (custom) — durée par défaut 60 min
                this.dureeProgrammeMin = 60;
            }
        }
    }

    /** Arrête le cycle (pause / annulation manuelle). */
    public void arreterCycle() {
        this.dateDebutCycle = null;
        this.dureeProgrammeMin = null;
    }

    /**
     * Minutes restantes avant la fin du cycle. {@code null} si pas de cycle en cours
     * ou cycle déjà terminé (ce qui arrive naturellement quand le scheduler ne
     * s'occupe pas de "stopper" — l'objet reste ACTIF mais la lecture renvoie 0).
     */
    public Integer computeDureeRestante() {
        if (dateDebutCycle == null || dureeProgrammeMin == null) {
            return null;
        }
        long elapsed = Duration.between(dateDebutCycle, Instant.now()).toMinutes();
        long remaining = dureeProgrammeMin - elapsed;
        if (remaining <= 0) {
            return 0;
        }
        return (int) remaining;
    }
}
