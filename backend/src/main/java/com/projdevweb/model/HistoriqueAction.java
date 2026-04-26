package com.projdevweb.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.time.Instant;

/**
 * Trace d'action utilisateur sur un objet connecté (UML : HistoriqueAction).
 *
 * <p>Référencé par FK vers {@link Utilisateur} et {@link ObjetConnecte} pour
 * conserver l'intégrité (vs. les chaînes dénormalisées de l'ancien
 * {@code GestionHistorique}).
 *
 * <p>Si l'objet a été supprimé, on conserve le snapshot {@code objetNomSnapshot}
 * pour pouvoir afficher l'historique malgré la perte de la FK (nullable).
 */
@Entity
@Table(
        name = "historique_action",
        indexes = {
                @Index(name = "idx_historique_timestamp", columnList = "timestamp"),
                @Index(name = "idx_historique_utilisateur", columnList = "utilisateur_id"),
                @Index(name = "idx_historique_objet", columnList = "objet_id")
        }
)
public class HistoriqueAction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Instant timestamp = Instant.now();

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private ActionType action;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "utilisateur_id", nullable = false)
    private Utilisateur utilisateur;

    /** Nullable : si l'objet a été supprimé après le log. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "objet_id")
    private ObjetConnecte objet;

    /** Snapshot du nom au moment du log (utile si l'objet est supprimé ensuite). */
    @Column(length = 120)
    private String objetNomSnapshot;

    /** Snapshot du type concret au moment du log (Volet, Camera, ...). */
    @Column(length = 40)
    private String objetTypeSnapshot;

    @Column(length = 1000)
    private String details;

    public HistoriqueAction() {
    }

    public HistoriqueAction(ActionType action,
                            Utilisateur utilisateur,
                            ObjetConnecte objet,
                            String details) {
        this.action = action;
        this.utilisateur = utilisateur;
        this.objet = objet;
        if (objet != null) {
            this.objetNomSnapshot = objet.getNom();
            this.objetTypeSnapshot = objet.getClass().getSimpleName();
        }
        this.details = details;
    }

    public Long getId() {
        return id;
    }

    public Instant getTimestamp() {
        return timestamp;
    }

    public ActionType getAction() {
        return action;
    }

    public Utilisateur getUtilisateur() {
        return utilisateur;
    }

    public ObjetConnecte getObjet() {
        return objet;
    }

    public String getObjetNomSnapshot() {
        return objetNomSnapshot;
    }

    public String getObjetTypeSnapshot() {
        return objetTypeSnapshot;
    }

    public String getDetails() {
        return details;
    }

    /** Détache la FK objet avant qu'il ne soit supprimé (préserve le snapshot). */
    public void detachObjet() {
        this.objet = null;
    }
}
