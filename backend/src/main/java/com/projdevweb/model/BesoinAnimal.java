package com.projdevweb.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;

import java.time.Instant;

/**
 * Besoin animal (Eau / Nourriture). Modélisation type produit Petkit/PetSafe :
 * <ul>
 *   <li>{@code niveau} — % de remplissage du réservoir / gamelle (0–100)</li>
 *   <li>{@code animal} — étiquette libre (Chat, Chien, …) — utile pour multi-animaux</li>
 *   <li>{@code portionGrammes} — portion par distribution (Nourriture) ou volume (Eau)</li>
 *   <li>{@code derniereDistribution} — quand la dernière distribution a eu lieu</li>
 *   <li>{@code prochaineDistribution} — quand la prochaine est prévue (mis à jour par le scheduler)</li>
 * </ul>
 *
 * <p>La distribution réelle est déclenchée soit par une {@link Scenario} programmée
 * (cron : « tous les jours à 8h »), soit manuellement par {@code distribuer()} côté UI.
 */
@Entity
public abstract class BesoinAnimal extends ObjetConnecte {

    private Float niveau;

    @Column(length = 60)
    private String animal;

    @Column
    private Integer portionGrammes;

    @Column
    private Instant derniereDistribution;

    @Column
    private Instant prochaineDistribution;

    protected BesoinAnimal() {
    }

    protected BesoinAnimal(String nom, String marque, Etat etat, Connectivite connectivite,
                          Float batterie, Piece piece, Float niveau, String animal) {
        super(nom, marque, etat, connectivite, batterie, piece);
        this.niveau = niveau;
        this.animal = animal;
        this.portionGrammes = 30; // portion type chat
    }

    public Float getNiveau() { return niveau; }
    public void setNiveau(Float niveau) {
        if (niveau == null) {
            this.niveau = null;
            return;
        }
        this.niveau = Math.max(0f, Math.min(100f, niveau));
    }

    public String getAnimal() { return animal; }
    public void setAnimal(String animal) { this.animal = animal; }

    public Integer getPortionGrammes() { return portionGrammes; }
    public void setPortionGrammes(Integer portionGrammes) { this.portionGrammes = portionGrammes; }

    public Instant getDerniereDistribution() { return derniereDistribution; }
    public void setDerniereDistribution(Instant derniereDistribution) { this.derniereDistribution = derniereDistribution; }

    public Instant getProchaineDistribution() { return prochaineDistribution; }
    public void setProchaineDistribution(Instant prochaineDistribution) { this.prochaineDistribution = prochaineDistribution; }

    /**
     * Effectue une distribution :
     * <ul>
     *   <li>diminue le niveau de réservoir d'une fraction proportionnelle à la portion,</li>
     *   <li>met à jour {@link #derniereDistribution}.</li>
     * </ul>
     */
    public void distribuer() {
        // 30g sur ~1500g de capacité réservoir = 2% par distribution
        float consommation = portionGrammes != null ? portionGrammes / 15f : 2f;
        if (this.niveau != null) {
            this.niveau = Math.max(0f, this.niveau - consommation);
        }
        this.derniereDistribution = Instant.now();
    }

    /** Remplit le réservoir à 100 %. Logué via {@code UPDATE_OBJET}. */
    public void remplir() {
        this.niveau = 100f;
    }
}
