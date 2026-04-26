package com.projdevweb.model;

/**
 * Type d'action loggué dans {@link HistoriqueAction} et qui détermine
 * l'incrément de points appliqué via {@code PointsService}.
 *
 * Incréments figés (cf. PLAN.md / DECISIONS.md) :
 * <ul>
 *   <li>{@link #LOGIN}           +0.25 (connexion)</li>
 *   <li>{@link #CONSULT_PROFILE} +0.50 (consultation profil)</li>
 *   <li>{@link #UPDATE_PROFILE}  +1.00 (mise à jour profil)</li>
 *   <li>{@link #SEARCH_OBJETS}   +0.50 (recherche / consultation objets)</li>
 *   <li>{@link #CREATE_OBJET}    +2.00 (création objet)</li>
 *   <li>{@link #UPDATE_OBJET}    +1.00 (mise à jour objet)</li>
 *   <li>{@link #TOGGLE_ETAT}     +0.50 (activation / désactivation)</li>
 *   <li>{@link #DELETE_OBJET}    +1.00 (suppression objet)</li>
 *   <li>{@link #REGISTER}        +0.25 (création de compte)</li>
 *   <li>{@link #SCENARIO_RUN}    +1.50 (exécution d'un scénario d'automation)</li>
 * </ul>
 */
public enum ActionType {
    REGISTER(0.25f),
    LOGIN(0.25f),
    CONSULT_PROFILE(0.50f),
    UPDATE_PROFILE(1.00f),
    SEARCH_OBJETS(0.50f),
    REQUEST_DELETE(0.25f),
    ADMIN_DECISION(0.00f),
    CREATE_OBJET(2.00f),
    UPDATE_OBJET(1.00f),
    TOGGLE_ETAT(0.50f),
    DELETE_OBJET(1.00f),
    MAINTENANCE_REPAIRED(0.75f),
    SCENARIO_RUN(1.50f);

    private final float points;

    ActionType(float points) {
        this.points = points;
    }

    public float getPoints() {
        return points;
    }
}
