package com.projdevweb.model;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Scénario d'automation : un ensemble d'{@link ScenarioAction} appliquées
 * à un trigger (manuel, cron programmé, ou événement conditionnel).
 *
 * <p>Exemples seedés : "Bonjour" (volets ouverts à 8h), "Bonsoir" (tout
 * éteint à 22h), "Cinéma" (manuel — TV + volets fermés), "Sécurité"
 * (manuel — portes fermées + alarme).
 */
@Entity
@Table(
        name = "scenario",
        indexes = {
                @Index(name = "idx_scenario_type", columnList = "type"),
                @Index(name = "idx_scenario_enabled", columnList = "enabled")
        }
)
public class Scenario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 80)
    private String nom;

    @Column(length = 500)
    private String description;

    /** Emoji ou clé d'icône courte (ex: "☀", "🌙", "🎬", "🔒"). */
    @Column(length = 16)
    private String icon;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private ScenarioType type = ScenarioType.MANUAL;

    /**
     * Expression cron Spring 6-champs (ex: "0 0 8 * * MON-FRI") — non nulle si
     * {@link #type} == {@link ScenarioType#SCHEDULED}, ignorée sinon.
     */
    @Column(length = 80)
    private String cron;

    /**
     * Condition libre interprétée par le service (ex: "night", "day", "temp<18")
     * — utilisée seulement si {@link #type} == {@link ScenarioType#CONDITIONAL}.
     */
    @Column(length = 120)
    private String condition;

    @Column(nullable = false)
    private Boolean enabled = Boolean.TRUE;

    @Column(nullable = false, updatable = false)
    private Instant dateCreation = Instant.now();

    @Column
    private Instant derniereExecution;

    @OneToMany(mappedBy = "scenario", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("id ASC")
    private List<ScenarioAction> actions = new ArrayList<>();

    public Scenario() {
    }

    public Scenario(String nom, String icon, ScenarioType type) {
        this.nom = nom;
        this.icon = icon;
        this.type = type;
    }

    public void addAction(ScenarioAction action) {
        action.setScenario(this);
        this.actions.add(action);
    }

    public void clearActions() {
        for (ScenarioAction a : actions) {
            a.setScenario(null);
        }
        actions.clear();
    }

    public Long getId() {
        return id;
    }

    public String getNom() {
        return nom;
    }

    public void setNom(String nom) {
        this.nom = nom;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getIcon() {
        return icon;
    }

    public void setIcon(String icon) {
        this.icon = icon;
    }

    public ScenarioType getType() {
        return type;
    }

    public void setType(ScenarioType type) {
        this.type = type;
    }

    public String getCron() {
        return cron;
    }

    public void setCron(String cron) {
        this.cron = cron;
    }

    public String getCondition() {
        return condition;
    }

    public void setCondition(String condition) {
        this.condition = condition;
    }

    public Boolean getEnabled() {
        return enabled;
    }

    public void setEnabled(Boolean enabled) {
        this.enabled = enabled != null ? enabled : Boolean.TRUE;
    }

    public Instant getDateCreation() {
        return dateCreation;
    }

    public Instant getDerniereExecution() {
        return derniereExecution;
    }

    public void setDerniereExecution(Instant derniereExecution) {
        this.derniereExecution = derniereExecution;
    }

    public List<ScenarioAction> getActions() {
        return actions;
    }
}
