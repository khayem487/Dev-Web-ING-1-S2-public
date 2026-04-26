package com.projdevweb.service;

import com.projdevweb.model.ActionType;
import com.projdevweb.model.BesoinAnimal;
import com.projdevweb.model.DonneeCapteur;
import com.projdevweb.model.DetecteurMouvement;
import com.projdevweb.model.Etat;
import com.projdevweb.model.LaveLinge;
import com.projdevweb.model.ObjetConnecte;
import com.projdevweb.model.Ouvrant;
import com.projdevweb.model.Scenario;
import com.projdevweb.model.ScenarioAction;
import com.projdevweb.model.ScenarioTriggerEvent;
import com.projdevweb.model.Utilisateur;
import com.projdevweb.repository.DonneeCapteurRepository;
import com.projdevweb.repository.ObjetConnecteRepository;
import com.projdevweb.repository.ScenarioRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalTime;
import java.time.ZoneId;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Moteur d'exécution des scénarios.
 *
 * <p>Applique chaque {@link ScenarioAction} de manière atomique :
 * <ul>
 *   <li>met à jour l'état (ACTIF/INACTIF) de l'objet,</li>
 *   <li>si l'objet est un {@link Ouvrant} et que la position cible est non-nulle,
 *       met à jour {@code Ouvrant.position},</li>
 *   <li>persiste l'objet et logge un {@link ActionType#SCENARIO_RUN} pour le scénario.</li>
 * </ul>
 *
 * <p>Le scheduler ({@code ScenarioScheduler}) appelle cette méthode quand un
 * scénario {@code SCHEDULED} matche l'horloge ; le contrôleur l'appelle pour
 * les déclenchements manuels.
 */
@Service
public class ScenarioService {

    private final ScenarioRepository scenarioRepository;
    private final ObjetConnecteRepository objetConnecteRepository;
    private final DonneeCapteurRepository donneeCapteurRepository;
    private final PointsService pointsService;

    public ScenarioService(ScenarioRepository scenarioRepository,
                           ObjetConnecteRepository objetConnecteRepository,
                           DonneeCapteurRepository donneeCapteurRepository,
                           PointsService pointsService) {
        this.scenarioRepository = scenarioRepository;
        this.objetConnecteRepository = objetConnecteRepository;
        this.donneeCapteurRepository = donneeCapteurRepository;
        this.pointsService = pointsService;
    }

    @Transactional
    public List<Scenario> runConditionalByEvent(Long objetId,
                                                ScenarioTriggerEvent event,
                                                Utilisateur utilisateur) {
        ObjetConnecte triggerObjet = objetId == null ? null : objetConnecteRepository.findById(objetId).orElse(null);
        List<Scenario> candidates = scenarioRepository.findConditionalByEventAndObjet(event, objetId);
        List<Scenario> executed = new ArrayList<>();

        for (Scenario s : candidates) {
            if (!conditionMatches(s, triggerObjet)) {
                continue;
            }
            run(s, utilisateur);
            executed.add(s);
        }
        return executed;
    }

    /**
     * Exécute le scénario donné. Si {@code utilisateur} est non-nul, l'incrément
     * de points et la trace historique sont attribués à cet utilisateur ; sinon
     * (déclenchement par scheduler), on logge sans points (utilisateur dummy
     * récupéré par le caller — voir {@code ScenarioScheduler}).
     */
    @Transactional
    public List<String> run(Scenario scenario, Utilisateur utilisateur) {
        List<String> details = new ArrayList<>();

        for (ScenarioAction action : scenario.getActions()) {
            ObjetConnecte objet = action.getObjet();
            if (objet == null) {
                continue;
            }

            String before = describe(objet);

            if (action.getTargetEtat() != null) {
                objet.setEtat(action.getTargetEtat());
            }

            if (objet instanceof Ouvrant ouvrant && action.getTargetPosition() != null) {
                int p = Math.max(0, Math.min(100, action.getTargetPosition()));
                ouvrant.setPosition(p);
            }

            // Pet feeder programmé : ACTIF + scénario = on distribue effectivement une portion
            if (objet instanceof BesoinAnimal feeder && action.getTargetEtat() == Etat.ACTIF) {
                feeder.distribuer();
            }

            // Lave-linge programmé : ACTIF = lance le cycle (calcule dureeRestante)
            if (objet instanceof LaveLinge laveLinge && action.getTargetEtat() == Etat.ACTIF
                    && laveLinge.getDateDebutCycle() == null) {
                laveLinge.demarrerCycle();
            }
            if (objet instanceof LaveLinge laveLinge2 && action.getTargetEtat() == Etat.INACTIF) {
                laveLinge2.arreterCycle();
            }

            objetConnecteRepository.save(objet);

            details.add(before + " → " + describe(objet));
        }

        scenario.setDerniereExecution(Instant.now());
        scenarioRepository.save(scenario);

        if (utilisateur != null) {
            String summary = "Scénario « " + scenario.getNom() + " » : "
                    + details.size() + " action" + (details.size() > 1 ? "s" : "") + " appliquée"
                    + (details.size() > 1 ? "s" : "");
            pointsService.record(utilisateur, ActionType.SCENARIO_RUN, null, summary);
        }

        return details;
    }

    private static String describe(ObjetConnecte o) {
        StringBuilder sb = new StringBuilder(o.getNom()).append(" [").append(o.getEtat());
        if (o instanceof Ouvrant ouvrant && ouvrant.getPosition() != null) {
            sb.append(", ").append(ouvrant.getPosition()).append('%');
        }
        sb.append(']');
        return sb.toString();
    }

    private boolean conditionMatches(Scenario scenario, ObjetConnecte triggerObjet) {
        String raw = scenario.getCondition();
        if (raw == null || raw.isBlank()) {
            return true;
        }

        String c = raw.trim().toLowerCase(Locale.ROOT);
        if ("night".equals(c)) {
            LocalTime t = LocalTime.now(ZoneId.systemDefault());
            return t.isAfter(LocalTime.of(20, 0)) || t.isBefore(LocalTime.of(7, 0));
        }
        if ("day".equals(c)) {
            LocalTime t = LocalTime.now(ZoneId.systemDefault());
            return !t.isBefore(LocalTime.of(7, 0)) && t.isBefore(LocalTime.of(20, 0));
        }

        Matcher m = Pattern.compile("^temp\\s*([<>]=?)\\s*(-?\\d+(?:\\.\\d+)?)$").matcher(c);
        if (m.matches()) {
            if (triggerObjet == null) {
                return false;
            }
            DonneeCapteur last = donneeCapteurRepository.findTop1ByObjetOrderByTimestampDesc(triggerObjet);
            if (last == null || last.getValeur() == null) {
                return false;
            }
            double current = last.getValeur();
            double target = Double.parseDouble(m.group(2));
            String op = m.group(1);
            return switch (op) {
                case "<" -> current < target;
                case "<=" -> current <= target;
                case ">" -> current > target;
                case ">=" -> current >= target;
                default -> false;
            };
        }

        // Condition inconnue => permissive pour ne pas bloquer la démo.
        return true;
    }

    private static Etat parseEtat(String value, Etat fallback) {
        if (value == null || value.isBlank()) {
            return fallback;
        }
        try {
            return Etat.valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            return fallback;
        }
    }

    public static Etat parseEtatOrDefault(String value) {
        return parseEtat(value, Etat.ACTIF);
    }
}
