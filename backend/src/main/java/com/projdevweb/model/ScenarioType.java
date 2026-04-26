package com.projdevweb.model;

/**
 * Type de déclencheur d'un {@link Scenario}.
 *
 * <ul>
 *   <li>{@link #MANUAL} — exécuté uniquement à la demande (bouton UI / appel API).</li>
 *   <li>{@link #SCHEDULED} — exécuté automatiquement par le scheduler quand son
 *       expression cron correspond à l'horloge du serveur.</li>
 *   <li>{@link #CONDITIONAL} — exécuté en réaction à un événement (mouvement,
 *       batterie faible, …) — câblé en P7.</li>
 * </ul>
 */
public enum ScenarioType {
    MANUAL,
    SCHEDULED,
    CONDITIONAL
}
