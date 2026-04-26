package com.projdevweb.controller;

import com.projdevweb.dto.ScenarioDTO;
import com.projdevweb.dto.ScenarioRunResultDTO;
import com.projdevweb.dto.ScenarioUpsertRequest;
import com.projdevweb.model.ObjetConnecte;
import com.projdevweb.model.Scenario;
import com.projdevweb.model.ScenarioAction;
import com.projdevweb.model.ScenarioTriggerEvent;
import com.projdevweb.model.ScenarioType;
import com.projdevweb.model.Utilisateur;
import com.projdevweb.repository.ObjetConnecteRepository;
import com.projdevweb.repository.ScenarioRepository;
import com.projdevweb.service.ScenarioService;
import com.projdevweb.service.SessionUtilisateurService;
import jakarta.servlet.http.HttpSession;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.support.CronExpression;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * Module Scénarios — réservé aux comptes Avancés (cf. {@code SessionUtilisateurService#requireAvance}).
 *
 * <p>Le scheduler (déclenchement automatique pour les scénarios SCHEDULED) ne passe
 * pas par ce contrôleur ; il appelle directement {@link ScenarioService#run}.
 */
@RestController
@RequestMapping("/api/gestion/scenarios")
public class ScenarioController {

    private final ScenarioRepository scenarioRepository;
    private final ObjetConnecteRepository objetConnecteRepository;
    private final SessionUtilisateurService sessionUtilisateurService;
    private final ScenarioService scenarioService;

    public ScenarioController(ScenarioRepository scenarioRepository,
                              ObjetConnecteRepository objetConnecteRepository,
                              SessionUtilisateurService sessionUtilisateurService,
                              ScenarioService scenarioService) {
        this.scenarioRepository = scenarioRepository;
        this.objetConnecteRepository = objetConnecteRepository;
        this.sessionUtilisateurService = sessionUtilisateurService;
        this.scenarioService = scenarioService;
    }

    @GetMapping
    public List<ScenarioDTO> list(HttpSession session) {
        sessionUtilisateurService.requireAvance(session);
        return scenarioRepository.findAllByOrderByDateCreationAsc().stream()
                .map(ScenarioDTO::from)
                .toList();
    }

    @GetMapping("/{id}")
    public ScenarioDTO get(@PathVariable Long id, HttpSession session) {
        sessionUtilisateurService.requireAvance(session);
        return ScenarioDTO.from(getOrThrow(id));
    }

    @PostMapping
    @Transactional
    public ScenarioDTO create(@Valid @RequestBody ScenarioUpsertRequest request, HttpSession session) {
        sessionUtilisateurService.requireAvance(session);

        Scenario scenario = new Scenario();
        applyMetadata(scenario, request);
        applyActions(scenario, request.actions());

        return ScenarioDTO.from(scenarioRepository.save(scenario));
    }

    @PutMapping("/{id}")
    @Transactional
    public ScenarioDTO update(@PathVariable Long id,
                              @Valid @RequestBody ScenarioUpsertRequest request,
                              HttpSession session) {
        sessionUtilisateurService.requireAvance(session);

        Scenario scenario = getOrThrow(id);
        applyMetadata(scenario, request);

        // Replace all actions wholesale — simple and predictable.
        scenario.clearActions();
        applyActions(scenario, request.actions());

        return ScenarioDTO.from(scenarioRepository.save(scenario));
    }

    @PatchMapping("/{id}/enabled")
    @Transactional
    public ScenarioDTO toggle(@PathVariable Long id,
                              @RequestBody Map<String, Boolean> body,
                              HttpSession session) {
        sessionUtilisateurService.requireAvance(session);

        Boolean enabled = body != null ? body.get("enabled") : null;
        if (enabled == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "enabled est requis (true/false)");
        }

        Scenario scenario = getOrThrow(id);
        scenario.setEnabled(enabled);
        return ScenarioDTO.from(scenarioRepository.save(scenario));
    }

    @DeleteMapping("/{id}")
    @Transactional
    public Map<String, Object> delete(@PathVariable Long id, HttpSession session) {
        sessionUtilisateurService.requireAvance(session);
        Scenario scenario = getOrThrow(id);
        scenarioRepository.delete(scenario);
        return Map.of("ok", true, "deletedId", id);
    }

    @PostMapping("/{id}/run")
    public ScenarioRunResultDTO run(@PathVariable Long id, HttpSession session) {
        Utilisateur utilisateur = sessionUtilisateurService.requireAvance(session);
        Scenario scenario = getOrThrow(id);

        if (Boolean.FALSE.equals(scenario.getEnabled())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Scénario désactivé");
        }

        List<String> details = scenarioService.run(scenario, utilisateur);
        return ScenarioRunResultDTO.of(scenario, details);
    }

    // ----------------- helpers ------------------

    private Scenario getOrThrow(Long id) {
        return scenarioRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Scénario introuvable: " + id));
    }

    private void applyMetadata(Scenario scenario, ScenarioUpsertRequest request) {
        scenario.setNom(request.nom().trim());
        scenario.setDescription(trimToNull(request.description()));
        scenario.setIcon(trimToNull(request.icon()));
        scenario.setType(parseType(request.type()));
        scenario.setCron(validateCron(scenario.getType(), trimToNull(request.cron())));
        scenario.setCondition(trimToNull(request.condition()));
        scenario.setTriggerObjetId(request.triggerObjetId());
        scenario.setTriggerEvent(parseTriggerEvent(request.triggerEvent()));
        scenario.setEnabled(request.enabled() == null ? Boolean.TRUE : request.enabled());

        if (scenario.getTriggerObjetId() != null && !objetConnecteRepository.existsById(scenario.getTriggerObjetId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "triggerObjetId introuvable: " + scenario.getTriggerObjetId());
        }

        if (scenario.getType() == ScenarioType.CONDITIONAL && scenario.getTriggerEvent() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "triggerEvent est requis pour un scénario CONDITIONAL");
        }
    }

    private void applyActions(Scenario scenario, List<ScenarioUpsertRequest.ScenarioActionRequest> requested) {
        if (requested == null) {
            return;
        }
        for (ScenarioUpsertRequest.ScenarioActionRequest a : requested) {
            if (a == null || a.objetId() == null) {
                continue;
            }
            ObjetConnecte objet = objetConnecteRepository.findById(a.objetId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Objet introuvable: " + a.objetId()));

            ScenarioAction action = new ScenarioAction(
                    objet,
                    ScenarioService.parseEtatOrDefault(a.targetEtat()),
                    a.targetPosition()
            );
            scenario.addAction(action);
        }
    }

    private static ScenarioType parseType(String value) {
        if (value == null || value.isBlank()) {
            return ScenarioType.MANUAL;
        }
        try {
            return ScenarioType.valueOf(value.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "type invalide (attendu: MANUAL, SCHEDULED, CONDITIONAL)");
        }
    }

    private static String validateCron(ScenarioType type, String cron) {
        if (type != ScenarioType.SCHEDULED) {
            // ignore cron for non-scheduled types
            return null;
        }
        if (cron == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "cron est requis pour un scénario SCHEDULED");
        }
        try {
            CronExpression.parse(cron);
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Expression cron invalide : " + cron + " (" + ex.getMessage() + ")");
        }
        return cron;
    }

    private static ScenarioTriggerEvent parseTriggerEvent(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return ScenarioTriggerEvent.valueOf(value.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "triggerEvent invalide (attendu: MOTION_DETECTED, BATTERY_LOW, TEMP_BELOW)");
        }
    }

    private static String trimToNull(String value) {
        if (value == null) return null;
        String t = value.trim();
        return t.isEmpty() ? null : t;
    }
}
