package com.projdevweb.model;

import jakarta.persistence.Column;
import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;

import java.time.Instant;
import java.util.Locale;

/**
 * Machine à café type Nespresso / DeLonghi connectée :
 * <ul>
 *   <li>{@link Boisson} — catalogue de boissons (Espresso, Long, Cappuccino, Latte, Americano)</li>
 *   <li>{@code niveauEau} — % du réservoir d'eau (0–100)</li>
 *   <li>{@code niveauCafe} — % du bac de grains/capsules (0–100)</li>
 *   <li>{@code dernierePreparation} — quand la dernière boisson a été servie</li>
 *   <li>{@code totalPreparations} — compteur cumulé pour stats</li>
 * </ul>
 *
 * <p>{@link #preparer(String)} consomme un peu d'eau + de café et incrémente le compteur.
 * Échoue silencieusement si l'un des réservoirs est vide.
 */
@Entity
@DiscriminatorValue("MACHINE_CAFE")
public class MachineCafe extends Appareil {

    public enum Boisson {
        ESPRESSO("Espresso", 8f, 12f),
        LONG("Café long", 15f, 12f),
        AMERICANO("Americano", 22f, 12f),
        CAPPUCCINO("Cappuccino", 18f, 14f),
        LATTE("Latte macchiato", 25f, 14f),
        EAU_CHAUDE("Eau chaude", 12f, 0f);

        private final String label;
        private final float consoEauPct;
        private final float consoCafePct;

        Boisson(String label, float consoEauPct, float consoCafePct) {
            this.label = label;
            this.consoEauPct = consoEauPct;
            this.consoCafePct = consoCafePct;
        }

        public String getLabel() { return label; }
        public float getConsoEauPct() { return consoEauPct; }
        public float getConsoCafePct() { return consoCafePct; }
    }

    @Column
    private Float niveauEau;

    @Column
    private Float niveauCafe;

    @Column
    private Instant dernierePreparation;

    @Column
    private Integer totalPreparations;

    @Column(length = 16)
    private String derniereBoisson;

    public MachineCafe() {
        super();
    }

    public MachineCafe(String nom, String marque, Etat etat, Connectivite connectivite,
                       Float batterie, Piece piece) {
        super(nom, marque, etat, connectivite, batterie, piece, "Veille");
        this.niveauEau = 80f;
        this.niveauCafe = 60f;
        this.totalPreparations = 0;
        this.derniereBoisson = Boisson.ESPRESSO.name();
    }

    public Float getNiveauEau() { return niveauEau; }
    public void setNiveauEau(Float niveauEau) {
        if (niveauEau == null) { this.niveauEau = null; return; }
        this.niveauEau = Math.max(0f, Math.min(100f, niveauEau));
    }

    public Float getNiveauCafe() { return niveauCafe; }
    public void setNiveauCafe(Float niveauCafe) {
        if (niveauCafe == null) { this.niveauCafe = null; return; }
        this.niveauCafe = Math.max(0f, Math.min(100f, niveauCafe));
    }

    public Instant getDernierePreparation() { return dernierePreparation; }
    public void setDernierePreparation(Instant t) { this.dernierePreparation = t; }

    public Integer getTotalPreparations() { return totalPreparations == null ? 0 : totalPreparations; }
    public void setTotalPreparations(Integer n) { this.totalPreparations = n; }

    public String getDerniereBoisson() { return derniereBoisson; }
    public void setDerniereBoisson(String b) {
        if (b == null || b.isBlank()) { this.derniereBoisson = null; return; }
        try {
            this.derniereBoisson = Boisson.valueOf(b.trim().toUpperCase(Locale.ROOT)).name();
        } catch (IllegalArgumentException ex) {
            // Unknown code — keep existing value instead of silently storing garbage
        }
    }

    /**
     * Prépare une boisson : consomme eau + café, met à jour les compteurs.
     * Renvoie {@code true} si la préparation a réussi, {@code false} si un
     * réservoir était trop bas.
     */
    public boolean preparer(String boissonCode) {
        Boisson b;
        try {
            b = Boisson.valueOf(boissonCode == null ? "" : boissonCode.toUpperCase());
        } catch (IllegalArgumentException ex) {
            return false;
        }
        float eauNeeded = b.getConsoEauPct();
        float cafeNeeded = b.getConsoCafePct();

        if (niveauEau == null || niveauEau < eauNeeded) return false;
        if (cafeNeeded > 0 && (niveauCafe == null || niveauCafe < cafeNeeded)) return false;

        setNiveauEau(niveauEau - eauNeeded);
        if (cafeNeeded > 0 && niveauCafe != null) setNiveauCafe(niveauCafe - cafeNeeded);
        this.dernierePreparation = Instant.now();
        this.totalPreparations = getTotalPreparations() + 1;
        this.derniereBoisson = b.name();
        setEtat(Etat.ACTIF);
        return true;
    }

    /** Recharge le réservoir d'eau à 100 %. */
    public void remplirEau() { this.niveauEau = 100f; }

    /** Recharge le bac de café à 100 %. */
    public void remplirCafe() { this.niveauCafe = 100f; }
}
