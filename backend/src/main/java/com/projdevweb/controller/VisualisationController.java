package com.projdevweb.controller;

import com.projdevweb.dto.ObjetConnecteDTO;
import com.projdevweb.dto.ServiceSummaryDTO;
import com.projdevweb.dto.UserProfileDTO;
import com.projdevweb.dto.UserProfileUpdateRequest;
import com.projdevweb.model.ActionType;
import com.projdevweb.model.Utilisateur;
import com.projdevweb.repository.ObjetConnecteRepository;
import com.projdevweb.service.PointsService;
import com.projdevweb.service.SessionUtilisateurService;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/visualisation")
public class VisualisationController {

    private final ObjetConnecteRepository objetConnecteRepository;
    private final SessionUtilisateurService sessionUtilisateurService;
    private final PointsService pointsService;

    public VisualisationController(ObjetConnecteRepository objetConnecteRepository,
                                   SessionUtilisateurService sessionUtilisateurService,
                                   PointsService pointsService) {
        this.objetConnecteRepository = objetConnecteRepository;
        this.sessionUtilisateurService = sessionUtilisateurService;
        this.pointsService = pointsService;
    }

    @GetMapping("/profile")
    public UserProfileDTO profile(HttpSession session) {
        Utilisateur utilisateur = sessionUtilisateurService.requireUser(session);
        // Silent : on récompense la consultation mais on ne pollue pas l'historique
        // (sinon une ligne "Consultation profil" par refresh de page → journal illisible).
        Utilisateur updated = pointsService.awardPoints(utilisateur, ActionType.CONSULT_PROFILE);
        return UserProfileDTO.from(updated);
    }

    @PutMapping("/profile")
    public UserProfileDTO updateProfile(@Valid @RequestBody UserProfileUpdateRequest request,
                                        HttpSession session) {
        Utilisateur utilisateur = sessionUtilisateurService.requireUser(session);

        utilisateur.setPseudo(trimToNull(request.pseudo()));
        utilisateur.setBioPublique(trimToNull(request.bioPublique()));
        utilisateur.setTelephonePrive(trimToNull(request.telephonePrive()));
        utilisateur.setAdressePrivee(trimToNull(request.adressePrivee()));

        Utilisateur updated = pointsService.record(utilisateur, ActionType.UPDATE_PROFILE, "Mise à jour profil");
        return UserProfileDTO.from(updated);
    }

    @GetMapping("/objets")
    public List<ObjetConnecteDTO> objets(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String service,
            @RequestParam(required = false) String etat,
            @RequestParam(required = false) Long pieceId,
            @RequestParam(required = false) String q,
            HttpSession session
    ) {
        Utilisateur utilisateur = sessionUtilisateurService.requireUser(session);

        String qNorm = normalize(q);
        String serviceNorm = normalize(service);
        String typeNorm = normalize(type);
        String etatNorm = normalize(etat);

        List<ObjetConnecteDTO> result = objetConnecteRepository.findAll().stream()
                .map(ObjetConnecteDTO::from)
                .filter(o -> typeNorm == null
                        || containsExactIgnoreCase(o.type(), typeNorm)
                        || containsExactIgnoreCase(o.branche(), typeNorm))
                .filter(o -> serviceNorm == null
                        || containsExactIgnoreCase(o.service(), serviceNorm))
                .filter(o -> etatNorm == null
                        || containsExactIgnoreCase(o.etat() != null ? o.etat().name() : null, etatNorm))
                .filter(o -> pieceId == null || pieceId.equals(o.pieceId()))
                .filter(o -> qNorm == null
                        || contains(o.nom(), qNorm)
                        || contains(o.marque(), qNorm)
                        || contains(o.type(), qNorm)
                        || contains(o.branche(), qNorm)
                        || contains(o.service(), qNorm)
                        || contains(o.pieceNom(), qNorm))
                .toList();

        // Silent : la recherche se déclenche à chaque saisie / changement de filtre,
        // on ne veut pas une ligne historique par interaction.
        pointsService.awardPoints(utilisateur, ActionType.SEARCH_OBJETS);
        return result;
    }

    @GetMapping("/services")
    public List<ServiceSummaryDTO> services(HttpSession session) {
        sessionUtilisateurService.requireUser(session);

        Map<String, Long> counts = objetConnecteRepository.findAll().stream()
                .map(ObjetConnecteDTO::from)
                .collect(Collectors.groupingBy(ObjetConnecteDTO::service, Collectors.counting()));

        return List.of(
                new ServiceSummaryDTO("Acces", "Accès et ouverture", counts.getOrDefault("Acces", 0L)),
                new ServiceSummaryDTO("Surveillance", "Surveillance et capteurs", counts.getOrDefault("Surveillance", 0L)),
                new ServiceSummaryDTO("Confort", "Confort et électroménager", counts.getOrDefault("Confort", 0L)),
                new ServiceSummaryDTO("Animal", "Besoins des animaux", counts.getOrDefault("Animal", 0L))
        );
    }

    private static String normalize(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.toLowerCase(Locale.ROOT).trim();
    }

    private static String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private static boolean contains(String value, String normalizedSearch) {
        return value != null && value.toLowerCase(Locale.ROOT).contains(normalizedSearch);
    }

    private static boolean containsExactIgnoreCase(String value, String normalizedValue) {
        return value != null && value.equalsIgnoreCase(normalizedValue);
    }
}
