package com.projdevweb.dto;

import jakarta.validation.constraints.Size;

/**
 * Payload de création / mise à jour d'un objet connecté.
 * Tous les champs sont optionnels — le contrôleur dispatche par type concret
 * et n'applique que ceux qui font sens (cf. {@code applySpecific}).
 */
public record GestionObjetUpsertRequest(
        String type,
        @Size(max = 255) String nom,
        @Size(max = 255) String marque,
        Long pieceId,
        String etat,
        String connectivite,
        Float batterie,

        // Ouvrant
        Integer position,

        // Capteur
        @Size(max = 255) String zone,

        // Appareil commun
        @Size(max = 255) String cycle,
        Float consoEnergie,

        // LaveLinge — programme + paramètres + commande start/stop
        @Size(max = 32) String programme,
        Integer tempLavage,
        Integer vitesseEssorage,
        /** "start" pour lancer le cycle, "stop" pour l'arrêter. */
        @Size(max = 16) String cycleAction,

        // Television
        Integer chaine,
        Integer volume,
        @Size(max = 32) String source,

        // Thermostat
        Float tempCible,
        @Size(max = 16) String mode,

        // BesoinAnimal
        Float niveau,
        @Size(max = 60) String animal,
        Integer portionGrammes,
        /** "distribuer" pour faire une distribution, "remplir" pour reset à 100%. */
        @Size(max = 16) String petAction,

        // Alarme
        @Size(max = 16) String alarmeStatut,
        @Size(max = 200) String alarmeZones,
        @Size(max = 8) String alarmeCodePin,
        /** "test" pour déclencher un test d'alerte, "reset" pour revenir DESARMEE. */
        @Size(max = 16) String alarmeAction,

        // Camera
        @Size(max = 16) String resolution,
        @Size(max = 16) String modeCamera,
        Boolean enregistrement,
        Boolean visionNocturne,

        // DetecteurMouvement
        Integer sensibilite,
        /** "detect" pour simuler un mouvement détecté. */
        @Size(max = 16) String motionAction
) {
}
