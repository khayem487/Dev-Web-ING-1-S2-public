package com.projdevweb.model;

import jakarta.persistence.Column;
import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;

import java.time.Instant;

/**
 * Aspirateur robot type Roomba / Roborock :
 * <ul>
 *   <li>{@link StatutAspirateur} : EN_VEILLE / EN_COURS / TERMINE / EN_CHARGE</li>
 *   <li>{@code zoneNettoyage} — pièce ou zone CSV à nettoyer</li>
 *   <li>{@code dureeNettoyageMin} — durée totale prévue d'un cycle</li>
 *   <li>{@code dateDebutCycle} — quand le cycle a démarré (null si pas en marche)</li>
 * </ul>
 *
 * <p>Le {@code etat} hérité d'ObjetConnecte est synchronisé : EN_COURS → ACTIF,
 * sinon INACTIF, pour rester cohérent avec les badges ON/OFF.
 */
@Entity
@DiscriminatorValue("ASPIRATEUR")
public class Aspirateur extends Appareil {

    public enum StatutAspirateur {
        EN_VEILLE("En veille"),
        EN_COURS("Nettoyage en cours"),
        TERMINE("Cycle terminé"),
        EN_CHARGE("En charge");

        private final String label;
        StatutAspirateur(String label) { this.label = label; }
        public String getLabel() { return label; }
    }

    @Enumerated(EnumType.STRING)
    @Column(length = 16)
    private StatutAspirateur statutAspirateur = StatutAspirateur.EN_VEILLE;

    /** Zone à nettoyer (libre, ex: "Salon, Cuisine" ou nom de pièce). */
    @Column(length = 120)
    private String zoneNettoyage;

    /** Durée prévue du cycle en minutes (45 min par défaut). */
    @Column
    private Integer dureeNettoyageMin;

    /** Quand le cycle a démarré ; null si à la base / en veille. */
    @Column
    private Instant dateDebutCycle;

    /** Pourcentage de batterie spécifique au robot (Appareil.batterie reste générique). */
    @Column
    private Integer pourcentageBatterieAspirateur = 100;

    public Aspirateur() {
        super();
    }

    public Aspirateur(String nom, String marque, Etat etat, Connectivite connectivite,
                      Float batterie, Piece piece) {
        super(nom, marque, etat, connectivite, batterie, piece, "En veille");
        this.zoneNettoyage = piece != null ? piece.getNom() : "Pièce principale";
        this.dureeNettoyageMin = 45;
    }

    public StatutAspirateur getStatutAspirateur() { return statutAspirateur; }
    public void setStatutAspirateur(StatutAspirateur statut) {
        this.statutAspirateur = statut == null ? StatutAspirateur.EN_VEILLE : statut;
        // ACTIF uniquement quand un cycle tourne réellement
        setEtat(this.statutAspirateur == StatutAspirateur.EN_COURS ? Etat.ACTIF : Etat.INACTIF);
    }

    public String getZoneNettoyage() { return zoneNettoyage; }
    public void setZoneNettoyage(String zoneNettoyage) { this.zoneNettoyage = zoneNettoyage; }

    public Integer getDureeNettoyageMin() { return dureeNettoyageMin; }
    public void setDureeNettoyageMin(Integer dureeNettoyageMin) {
        if (dureeNettoyageMin == null) { this.dureeNettoyageMin = null; return; }
        this.dureeNettoyageMin = Math.max(5, Math.min(180, dureeNettoyageMin));
    }

    public Instant getDateDebutCycle() { return dateDebutCycle; }
    public void setDateDebutCycle(Instant dateDebutCycle) { this.dateDebutCycle = dateDebutCycle; }

    public Integer getPourcentageBatterieAspirateur() { return pourcentageBatterieAspirateur; }
    public void setPourcentageBatterieAspirateur(Integer p) { this.pourcentageBatterieAspirateur = p; }

    /** Démarre un cycle de nettoyage : passe en EN_COURS, horodate. */
    public void demarrerCycle() {
        this.statutAspirateur = StatutAspirateur.EN_COURS;
        this.dateDebutCycle = Instant.now();
        if (this.dureeNettoyageMin == null) this.dureeNettoyageMin = 45;
        setEtat(Etat.ACTIF);
    }

    /** Stop manuel : retour à la base. */
    public void retourBase() {
        this.statutAspirateur = StatutAspirateur.EN_CHARGE;
        this.dateDebutCycle = null;
        setEtat(Etat.INACTIF);
    }

    /** Cycle terminé proprement (e.g. par scheduler quand temps écoulé). */
    public void terminerCycle() {
        this.statutAspirateur = StatutAspirateur.TERMINE;
        this.dateDebutCycle = null;
        setEtat(Etat.INACTIF);
    }
}
