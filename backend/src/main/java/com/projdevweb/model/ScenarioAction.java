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

/**
 * Une action atomique appliquée par un {@link Scenario} à un objet :
 * mettre l'objet à un état cible et, si c'est un {@link Ouvrant},
 * éventuellement positionner le slider à un pourcentage cible.
 */
@Entity
@Table(
        name = "scenario_action",
        indexes = {
                @Index(name = "idx_scenario_action_scenario", columnList = "scenario_id"),
                @Index(name = "idx_scenario_action_objet", columnList = "objet_id")
        }
)
public class ScenarioAction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "scenario_id", nullable = false)
    private Scenario scenario;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "objet_id", nullable = false)
    private ObjetConnecte objet;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private Etat targetEtat = Etat.ACTIF;

    /** Position cible 0–100 — appliquée seulement si l'objet est un {@link Ouvrant}. */
    @Column
    private Integer targetPosition;

    public ScenarioAction() {
    }

    public ScenarioAction(ObjetConnecte objet, Etat targetEtat, Integer targetPosition) {
        this.objet = objet;
        this.targetEtat = targetEtat;
        this.targetPosition = targetPosition;
    }

    public Long getId() {
        return id;
    }

    public Scenario getScenario() {
        return scenario;
    }

    public void setScenario(Scenario scenario) {
        this.scenario = scenario;
    }

    public ObjetConnecte getObjet() {
        return objet;
    }

    public void setObjet(ObjetConnecte objet) {
        this.objet = objet;
    }

    public Etat getTargetEtat() {
        return targetEtat;
    }

    public void setTargetEtat(Etat targetEtat) {
        this.targetEtat = targetEtat;
    }

    public Integer getTargetPosition() {
        return targetPosition;
    }

    public void setTargetPosition(Integer targetPosition) {
        this.targetPosition = targetPosition;
    }
}
