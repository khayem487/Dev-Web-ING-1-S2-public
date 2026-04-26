package com.projdevweb.model;

import jakarta.persistence.Column;
import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;

import java.time.Instant;

/**
 * Détecteur de mouvement type PIR (passif infrarouge) :
 * <ul>
 *   <li>{@code sensibilite} — seuil 1–10 (10 = très sensible)</li>
 *   <li>{@code derniereDetectionAt} — timestamp du dernier mouvement détecté</li>
 *   <li>{@code totalDetections} — compteur cumulé pour la démo</li>
 * </ul>
 *
 * <p>Pas de capteur réel → la détection est simulée par {@link #declencherDetection()}
 * appelé via le bouton « Simuler mouvement » de l'UI ou par un scénario CONDITIONAL.
 */
@Entity
@DiscriminatorValue("DETECTEUR_MOUVEMENT")
public class DetecteurMouvement extends Capteur {

    @Column
    private Integer sensibilite;

    @Column
    private Instant derniereDetectionAt;

    @Column
    private Integer totalDetections;

    public DetecteurMouvement() {
        super();
    }

    public DetecteurMouvement(String nom, String marque, Etat etat, Connectivite connectivite,
                              Float batterie, Piece piece, String zone) {
        super(nom, marque, etat, connectivite, batterie, piece, zone);
        this.sensibilite = 5;
        this.totalDetections = 0;
    }

    public Integer getSensibilite() { return sensibilite; }
    public void setSensibilite(Integer sensibilite) {
        if (sensibilite == null) { this.sensibilite = null; return; }
        this.sensibilite = Math.max(1, Math.min(10, sensibilite));
    }

    public Instant getDerniereDetectionAt() { return derniereDetectionAt; }
    public void setDerniereDetectionAt(Instant t) { this.derniereDetectionAt = t; }

    public Integer getTotalDetections() { return totalDetections == null ? 0 : totalDetections; }
    public void setTotalDetections(Integer totalDetections) { this.totalDetections = totalDetections; }

    /** Simule une détection : MAJ timestamp + incrémente compteur. */
    public void declencherDetection() {
        this.derniereDetectionAt = Instant.now();
        this.totalDetections = getTotalDetections() + 1;
        if (getEtat() != Etat.ACTIF) setEtat(Etat.ACTIF);
    }
}
