package com.projdevweb.controller;

import com.projdevweb.dto.AdminDecisionRequest;
import com.projdevweb.dto.AdminUserToggleRequest;
import com.projdevweb.dto.DemandeSuppressionDTO;
import com.projdevweb.dto.UserProfileDTO;
import com.projdevweb.model.ActionType;
import com.projdevweb.model.DemandeSuppression;
import com.projdevweb.model.DemandeSuppressionStatus;
import com.projdevweb.model.ObjetConnecte;
import com.projdevweb.model.Utilisateur;
import com.projdevweb.repository.DemandeSuppressionRepository;
import com.projdevweb.repository.DonneeCapteurRepository;
import com.projdevweb.repository.HistoriqueActionRepository;
import com.projdevweb.repository.ObjetConnecteRepository;
import com.projdevweb.repository.ScenarioActionRepository;
import com.projdevweb.repository.UtilisateurRepository;
import com.projdevweb.service.PointsService;
import com.projdevweb.service.SessionUtilisateurService;
import jakarta.servlet.http.HttpSession;
import jakarta.transaction.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final SessionUtilisateurService sessionUtilisateurService;
    private final UtilisateurRepository utilisateurRepository;
    private final DemandeSuppressionRepository demandeSuppressionRepository;
    private final ObjetConnecteRepository objetConnecteRepository;
    private final HistoriqueActionRepository historiqueActionRepository;
    private final DonneeCapteurRepository donneeCapteurRepository;
    private final ScenarioActionRepository scenarioActionRepository;
    private final PointsService pointsService;

    public AdminController(SessionUtilisateurService sessionUtilisateurService,
                           UtilisateurRepository utilisateurRepository,
                           DemandeSuppressionRepository demandeSuppressionRepository,
                           ObjetConnecteRepository objetConnecteRepository,
                           HistoriqueActionRepository historiqueActionRepository,
                           DonneeCapteurRepository donneeCapteurRepository,
                           ScenarioActionRepository scenarioActionRepository,
                           PointsService pointsService) {
        this.sessionUtilisateurService = sessionUtilisateurService;
        this.utilisateurRepository = utilisateurRepository;
        this.demandeSuppressionRepository = demandeSuppressionRepository;
        this.objetConnecteRepository = objetConnecteRepository;
        this.historiqueActionRepository = historiqueActionRepository;
        this.donneeCapteurRepository = donneeCapteurRepository;
        this.scenarioActionRepository = scenarioActionRepository;
        this.pointsService = pointsService;
    }

    @GetMapping("/utilisateurs")
    public List<UserProfileDTO> utilisateurs(HttpSession session) {
        sessionUtilisateurService.requireAdmin(session);
        return utilisateurRepository.findAll().stream().map(UserProfileDTO::from).toList();
    }

    @PatchMapping("/utilisateurs/{id}/admin")
    public UserProfileDTO toggleAdmin(@PathVariable Long id,
                                      @RequestBody AdminUserToggleRequest request,
                                      HttpSession session) {
        Utilisateur admin = sessionUtilisateurService.requireAdmin(session);
        Utilisateur cible = utilisateurRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Utilisateur introuvable: " + id));

        if (Boolean.TRUE.equals(request.admin()) == cible.isAdmin()) {
            return UserProfileDTO.from(cible);
        }

        if (admin.getId().equals(cible.getId()) && !Boolean.TRUE.equals(request.admin())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Impossible de retirer votre propre rôle admin");
        }

        if (!Boolean.TRUE.equals(request.admin()) && cible.isAdmin()) {
            long adminCount = utilisateurRepository.countByAdminTrue();
            if (adminCount <= 1) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "Impossible de retirer le dernier admin actif");
            }
        }

        cible.setAdmin(Boolean.TRUE.equals(request.admin()));
        Utilisateur saved = utilisateurRepository.save(cible);

        pointsService.record(admin, ActionType.ADMIN_DECISION, null,
                "Admin role " + (saved.isAdmin() ? "granted" : "revoked") + " for " + saved.getEmail());

        return UserProfileDTO.from(saved);
    }

    @GetMapping("/demandes-suppression")
    public List<DemandeSuppressionDTO> demandes(@RequestParam(required = false) String status,
                                                HttpSession session) {
        sessionUtilisateurService.requireAdmin(session);
        if (status == null || status.isBlank()) {
            return demandeSuppressionRepository.findAllByOrderByCreatedAtDesc().stream()
                    .map(DemandeSuppressionDTO::from)
                    .toList();
        }
        DemandeSuppressionStatus parsed = parseStatus(status);
        return demandeSuppressionRepository.findAllByStatusOrderByCreatedAtDesc(parsed).stream()
                .map(DemandeSuppressionDTO::from)
                .toList();
    }

    @PostMapping("/demandes-suppression/{id}/decision")
    @Transactional
    public DemandeSuppressionDTO decision(@PathVariable Long id,
                                          @RequestBody AdminDecisionRequest request,
                                          HttpSession session) {
        Utilisateur admin = sessionUtilisateurService.requireAdmin(session);
        DemandeSuppression demande = demandeSuppressionRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Demande introuvable: " + id));

        if (demande.getStatus() != DemandeSuppressionStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Demande déjà traitée");
        }

        String decision = request != null && request.decision() != null
                ? request.decision().trim().toLowerCase(Locale.ROOT)
                : "";

        if (!decision.equals("approve") && !decision.equals("reject")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "decision attendue: approve|reject");
        }

        demande.setStatus(decision.equals("approve")
                ? DemandeSuppressionStatus.APPROVED
                : DemandeSuppressionStatus.REJECTED);
        demande.setTraitePar(admin);
        demande.setResolvedAt(Instant.now());
        demande.setNoteAdmin(request != null ? request.note() : null);

        if (demande.getStatus() == DemandeSuppressionStatus.APPROVED && demande.getObjet() != null) {
            ObjetConnecte objet = demande.getObjet();
            pointsService.record(admin, ActionType.DELETE_OBJET, objet,
                    "Admin approved deletion for '" + objet.getNom() + "'");

            historiqueActionRepository.detachObjet(objet);
            scenarioActionRepository.deleteByObjet(objet);
            donneeCapteurRepository.deleteByObjet(objet);
            objetConnecteRepository.delete(objet);

            // keep demande row as audit trail even after object deletion
            demande.setObjet(null);
        } else {
            pointsService.record(admin, ActionType.ADMIN_DECISION, null,
                    "Admin rejected deletion request #" + demande.getId());
        }

        DemandeSuppression saved = demandeSuppressionRepository.save(demande);
        return DemandeSuppressionDTO.from(saved);
    }

    private static DemandeSuppressionStatus parseStatus(String value) {
        try {
            return DemandeSuppressionStatus.valueOf(value.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "status invalide (attendu: PENDING, APPROVED, REJECTED)");
        }
    }

    @GetMapping("/health")
    public Map<String, Object> health(HttpSession session) {
        Utilisateur admin = sessionUtilisateurService.requireAdmin(session);
        return Map.of("ok", true, "adminEmail", admin.getEmail());
    }
}
