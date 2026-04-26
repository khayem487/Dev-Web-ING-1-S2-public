package com.projdevweb.controller;

import com.projdevweb.dto.DonneeCapteurDTO;
import com.projdevweb.dto.DemandeSuppressionCreateRequest;
import com.projdevweb.dto.DemandeSuppressionDTO;
import com.projdevweb.dto.GestionEtatRequest;
import com.projdevweb.dto.GestionObjetDetailDTO;
import com.projdevweb.dto.GestionObjetUpsertRequest;
import com.projdevweb.dto.GestionStatsDTO;
import com.projdevweb.dto.HistoriqueActionDTO;
import com.projdevweb.dto.MaintenanceItemDTO;
import com.projdevweb.dto.ObjetConnecteDTO;
import com.projdevweb.dto.ServiceSummaryDTO;
import com.projdevweb.model.ActionType;
import com.projdevweb.model.Appareil;
import com.projdevweb.model.BesoinAnimal;
import com.projdevweb.model.Camera;
import com.projdevweb.model.Capteur;
import com.projdevweb.model.Connectivite;
import com.projdevweb.model.DemandeSuppression;
import com.projdevweb.model.DemandeSuppressionStatus;
import com.projdevweb.model.Eau;
import com.projdevweb.model.Etat;
import com.projdevweb.model.LaveLinge;
import com.projdevweb.model.Nourriture;
import com.projdevweb.model.ObjetConnecte;
import com.projdevweb.model.Ouvrant;
import com.projdevweb.model.Piece;
import com.projdevweb.model.Porte;
import com.projdevweb.model.Television;
import com.projdevweb.model.Thermostat;
import com.projdevweb.model.Utilisateur;
import com.projdevweb.model.Volet;
import com.projdevweb.repository.DemandeSuppressionRepository;
import com.projdevweb.repository.DonneeCapteurRepository;
import com.projdevweb.repository.HistoriqueActionRepository;
import com.projdevweb.repository.ObjetConnecteRepository;
import com.projdevweb.repository.PieceRepository;
import com.projdevweb.repository.ScenarioActionRepository;
import com.projdevweb.service.PointsService;
import com.projdevweb.service.SessionUtilisateurService;
import jakarta.servlet.http.HttpSession;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.StringJoiner;
import java.util.stream.Collectors;

/**
 * Module Gestion : réservé aux utilisateurs niveau {@code AVANCE}
 * (uniquement {@code ParentFamille} avec ≥10 points).
 *
 * <p>La garde est centralisée via {@link SessionUtilisateurService#requireAvance(HttpSession)} :
 * 401 si non connecté, 403 si niveau insuffisant.
 */
@RestController
@RequestMapping("/api/gestion")
public class GestionController {

    private final ObjetConnecteRepository objetConnecteRepository;
    private final PieceRepository pieceRepository;
    private final DemandeSuppressionRepository demandeSuppressionRepository;
    private final HistoriqueActionRepository historiqueActionRepository;
    private final DonneeCapteurRepository donneeCapteurRepository;
    private final ScenarioActionRepository scenarioActionRepository;
    private final SessionUtilisateurService sessionUtilisateurService;
    private final PointsService pointsService;

    public GestionController(ObjetConnecteRepository objetConnecteRepository,
                             PieceRepository pieceRepository,
                             DemandeSuppressionRepository demandeSuppressionRepository,
                             HistoriqueActionRepository historiqueActionRepository,
                             DonneeCapteurRepository donneeCapteurRepository,
                             ScenarioActionRepository scenarioActionRepository,
                             SessionUtilisateurService sessionUtilisateurService,
                             PointsService pointsService) {
        this.objetConnecteRepository = objetConnecteRepository;
        this.pieceRepository = pieceRepository;
        this.demandeSuppressionRepository = demandeSuppressionRepository;
        this.historiqueActionRepository = historiqueActionRepository;
        this.donneeCapteurRepository = donneeCapteurRepository;
        this.scenarioActionRepository = scenarioActionRepository;
        this.sessionUtilisateurService = sessionUtilisateurService;
        this.pointsService = pointsService;
    }

    @GetMapping("/objets")
    public List<ObjetConnecteDTO> objets(HttpSession session) {
        sessionUtilisateurService.requireAvance(session);
        return objetConnecteRepository.findAll().stream().map(ObjetConnecteDTO::from).toList();
    }

    @GetMapping("/objets/{id}")
    public GestionObjetDetailDTO objetDetail(@PathVariable Long id, HttpSession session) {
        sessionUtilisateurService.requireAvance(session);
        return GestionObjetDetailDTO.from(getObjet(id));
    }

    @PostMapping("/objets")
    public GestionObjetDetailDTO createObjet(@Valid @RequestBody GestionObjetUpsertRequest request,
                                             HttpSession session) {
        Utilisateur utilisateur = sessionUtilisateurService.requireAvance(session);
        Piece piece = getPieceRequired(request.pieceId());

        ObjetConnecte objet = buildByType(request, piece);
        applyCommon(objet, request, piece);
        applySpecific(objet, request);

        ObjetConnecte saved = objetConnecteRepository.save(objet);

        pointsService.record(utilisateur, ActionType.CREATE_OBJET, saved,
                "Création " + saved.getClass().getSimpleName() + " '" + saved.getNom() + "'");

        return GestionObjetDetailDTO.from(saved);
    }

    @PutMapping("/objets/{id}")
    public GestionObjetDetailDTO updateObjet(@PathVariable Long id,
                                             @Valid @RequestBody GestionObjetUpsertRequest request,
                                             HttpSession session) {
        Utilisateur utilisateur = sessionUtilisateurService.requireAvance(session);
        ObjetConnecte objet = getObjet(id);

        Piece piece = request.pieceId() != null ? getPieceRequired(request.pieceId()) : objet.getPiece();

        applyCommon(objet, request, piece);
        applySpecific(objet, request);

        ObjetConnecte saved = objetConnecteRepository.save(objet);

        pointsService.record(utilisateur, ActionType.UPDATE_OBJET, saved,
                "Mise à jour paramètres '" + saved.getNom() + "'");

        return GestionObjetDetailDTO.from(saved);
    }

    @PatchMapping("/objets/{id}/etat")
    public GestionObjetDetailDTO toggleEtat(@PathVariable Long id,
                                            @RequestBody GestionEtatRequest request,
                                            HttpSession session) {
        Utilisateur utilisateur = sessionUtilisateurService.requireAvance(session);
        ObjetConnecte objet = getObjet(id);

        objet.setEtat(request.actif() ? Etat.ACTIF : Etat.INACTIF);
        ObjetConnecte saved = objetConnecteRepository.save(objet);

        pointsService.record(utilisateur, ActionType.TOGGLE_ETAT, saved,
                saved.getNom() + " → " + saved.getEtat());

        return GestionObjetDetailDTO.from(saved);
    }

    @DeleteMapping("/objets/{id}")
    @Transactional
    public Map<String, Object> deleteObjet(@PathVariable Long id, HttpSession session) {
        Utilisateur utilisateur = sessionUtilisateurService.requireAvance(session);
        ObjetConnecte objet = getObjet(id);

        // 1. Log AVANT suppression (snapshot conservé même si l'objet disparaît)
        pointsService.record(utilisateur, ActionType.DELETE_OBJET, objet,
                "Suppression '" + objet.getNom() + "'");

        // 2. Détacher la FK objet sur les anciennes traces (préserve les snapshots)
        historiqueActionRepository.detachObjet(objet);

        // 3. Supprimer les actions de scénario qui ciblaient cet objet (FK NOT NULL)
        scenarioActionRepository.deleteByObjet(objet);

        // 4. Supprimer les données capteur (FK NOT NULL)
        donneeCapteurRepository.deleteByObjet(objet);

        // 5. Supprimer l'objet lui-même
        objetConnecteRepository.delete(objet);

        return Map.of("ok", true, "deletedId", id);
    }

    @PostMapping("/objets/{id}/demande-suppression")
    public DemandeSuppressionDTO demanderSuppression(@PathVariable Long id,
                                                     @RequestBody(required = false) DemandeSuppressionCreateRequest request,
                                                     HttpSession session) {
        Utilisateur utilisateur = sessionUtilisateurService.requireAvance(session);
        ObjetConnecte objet = getObjet(id);

        if (demandeSuppressionRepository.existsByDemandeurAndObjetAndStatus(
                utilisateur, objet, DemandeSuppressionStatus.PENDING)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Une demande en attente existe déjà pour cet objet");
        }

        String raison = request != null ? trimToNull(request.raison()) : null;
        DemandeSuppression demande = new DemandeSuppression(objet, utilisateur, raison);
        DemandeSuppression saved = demandeSuppressionRepository.save(demande);

        pointsService.record(utilisateur, ActionType.REQUEST_DELETE, objet,
                "Demande suppression objet '" + objet.getNom() + "'");

        return DemandeSuppressionDTO.from(saved);
    }

    @GetMapping("/demandes-suppression/mes-demandes")
    public List<DemandeSuppressionDTO> mesDemandes(HttpSession session) {
        Utilisateur utilisateur = sessionUtilisateurService.requireUser(session);
        return demandeSuppressionRepository.findAllByDemandeurOrderByCreatedAtDesc(utilisateur).stream()
                .map(DemandeSuppressionDTO::from)
                .toList();
    }

    @GetMapping("/stats")
    public GestionStatsDTO stats(HttpSession session) {
        sessionUtilisateurService.requireAvance(session);

        List<ObjetConnecteDTO> objets = objetConnecteRepository.findAll().stream()
                .map(ObjetConnecteDTO::from)
                .toList();

        long total = objets.size();
        long actifs = objets.stream().filter(o -> o.etat() == Etat.ACTIF).count();
        long inactifs = total - actifs;

        List<GestionStatsDTO.PieceCountDTO> parPiece = objets.stream()
                .filter(o -> o.pieceNom() != null)
                .collect(Collectors.groupingBy(ObjetConnecteDTO::pieceNom, Collectors.counting()))
                .entrySet().stream()
                .map(e -> new GestionStatsDTO.PieceCountDTO(e.getKey(), e.getValue()))
                .sorted((a, b) -> Long.compare(b.objets(), a.objets()))
                .toList();

        Map<String, Long> byService = objets.stream()
                .collect(Collectors.groupingBy(ObjetConnecteDTO::service, Collectors.counting()));

        List<ServiceSummaryDTO> parService = List.of(
                new ServiceSummaryDTO("Acces", "Accès et ouverture", byService.getOrDefault("Acces", 0L)),
                new ServiceSummaryDTO("Surveillance", "Surveillance et capteurs", byService.getOrDefault("Surveillance", 0L)),
                new ServiceSummaryDTO("Confort", "Confort et électroménager", byService.getOrDefault("Confort", 0L)),
                new ServiceSummaryDTO("Animal", "Besoins des animaux", byService.getOrDefault("Animal", 0L))
        );

        return new GestionStatsDTO(
                total,
                actifs,
                inactifs,
                parPiece,
                parService,
                historiqueActionRepository.count()
        );
    }

    @GetMapping("/historique")
    public List<HistoriqueActionDTO> historique(@RequestParam(defaultValue = "25") int limit,
                                                HttpSession session) {
        sessionUtilisateurService.requireAvance(session);
        int safeLimit = Math.max(1, Math.min(limit, 100));
        return historiqueActionRepository
                .findAllByOrderByTimestampDesc(PageRequest.of(0, safeLimit))
                .getContent().stream()
                .map(HistoriqueActionDTO::from)
                .toList();
    }

    /**
     * Dernières mesures {@code DonneeCapteur} pour un objet (typiquement un
     * Capteur — Thermostat / Camera). Sert au sparkline du DetailDrawer côté UI.
     * Ordre chronologique croissant (ancien → récent) pour faciliter le rendu.
     */
    @GetMapping("/objets/{id}/donnees")
    public List<DonneeCapteurDTO> donnees(@PathVariable Long id, HttpSession session) {
        sessionUtilisateurService.requireAvance(session);
        ObjetConnecte objet = getObjet(id);
        return donneeCapteurRepository.findTop20ByObjetOrderByTimestampDesc(objet).stream()
                .sorted((a, b) -> a.getTimestamp().compareTo(b.getTimestamp()))
                .map(DonneeCapteurDTO::from)
                .toList();
    }

    @GetMapping("/maintenance")
    public List<MaintenanceItemDTO> maintenance(HttpSession session) {
        sessionUtilisateurService.requireAvance(session);
        return objetConnecteRepository.findAll().stream()
                .map(this::toMaintenanceItem)
                .filter(java.util.Objects::nonNull)
                .sorted(Comparator
                        .comparingInt((MaintenanceItemDTO i) -> maintenancePriority(i.severite())).reversed()
                        .thenComparing(MaintenanceItemDTO::nom, String.CASE_INSENSITIVE_ORDER))
                .toList();
    }

    @PostMapping("/objets/{id}/maintenance/reparer")
    public GestionObjetDetailDTO reparerObjet(@PathVariable Long id, HttpSession session) {
        Utilisateur utilisateur = sessionUtilisateurService.requireAvance(session);
        ObjetConnecte objet = getObjet(id);

        objet.marquerRepare();
        if (objet.getBatterie() != null) {
            objet.setBatterie(100f);
        }
        ObjetConnecte saved = objetConnecteRepository.save(objet);

        pointsService.record(utilisateur, ActionType.MAINTENANCE_REPAIRED, saved,
                "Maintenance marquée pour '" + saved.getNom() + "'");

        return GestionObjetDetailDTO.from(saved);
    }

    @GetMapping(value = "/exports/objets", produces = "text/csv")
    public ResponseEntity<String> exportObjetsCsv(HttpSession session) {
        sessionUtilisateurService.requireAvance(session);
        List<ObjetConnecteDTO> objets = objetConnecteRepository.findAll().stream().map(ObjetConnecteDTO::from).toList();

        StringBuilder csv = new StringBuilder();
        csv.append("id,nom,type,service,piece,etat,connectivite,batterie,derniereMaintenance\n");
        for (ObjetConnecteDTO o : objets) {
            csv.append(csv(o.id())).append(',')
                    .append(csv(o.nom())).append(',')
                    .append(csv(o.type())).append(',')
                    .append(csv(o.service())).append(',')
                    .append(csv(o.pieceNom())).append(',')
                    .append(csv(o.etat() != null ? o.etat().name() : null)).append(',')
                    .append(csv(o.connectivite() != null ? o.connectivite().name() : null)).append(',')
                    .append(csv(o.batterie())).append(',')
                    .append(csv(o.derniereMaintenance()))
                    .append('\n');
        }

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=gestion_objets.csv")
                .contentType(new MediaType("text", "csv"))
                .body(csv.toString());
    }

    @GetMapping(value = "/exports/conso", produces = "text/csv")
    public ResponseEntity<String> exportConsoCsv(HttpSession session) {
        sessionUtilisateurService.requireAvance(session);
        List<ObjetConnecte> objets = objetConnecteRepository.findAll();

        Map<String, Double> consoByService = objets.stream()
                .collect(Collectors.groupingBy(
                        o -> ObjetConnecteDTO.from(o).service(),
                        Collectors.summingDouble(o -> {
                            if (o instanceof Appareil a && a.getConsoEnergie() != null) return a.getConsoEnergie();
                            return 0d;
                        })
                ));

        StringJoiner joiner = new StringJoiner("\n");
        joiner.add("service,consoTotale");
        consoByService.forEach((service, conso) ->
                joiner.add(csv(service) + "," + csv(String.format(Locale.US, "%.2f", conso))));

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=gestion_conso.csv")
                .contentType(new MediaType("text", "csv"))
                .body(joiner.toString() + "\n");
    }

    // ---------- helpers ----------

    private ObjetConnecte buildByType(GestionObjetUpsertRequest request, Piece piece) {
        String type = normalize(request.type());
        if (type == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "type est requis pour la création");
        }

        Etat etat = parseEtat(request.etat(), Etat.INACTIF);
        Connectivite connectivite = parseConnectivite(request.connectivite(), Connectivite.WIFI);
        Float batterie = request.batterie();
        String nom = requiredNom(request.nom());
        String marque = trimToNull(request.marque());

        return switch (type) {
            case "porte" -> new Porte(nom, marque, etat, connectivite, batterie, piece, defaultInteger(request.position(), 0));
            case "volet" -> new Volet(nom, marque, etat, connectivite, batterie, piece, defaultInteger(request.position(), 0));
            case "thermostat" -> new Thermostat(nom, marque, etat, connectivite, batterie, piece, defaultString(request.zone(), "Zone"));
            case "camera" -> new Camera(nom, marque, etat, connectivite, batterie, piece, defaultString(request.zone(), "Zone"));
            case "television" -> new Television(nom, marque, etat, connectivite, batterie, piece, defaultString(request.cycle(), "Veille"));
            case "lavelinge" -> new LaveLinge(nom, marque, etat, connectivite, batterie, piece, defaultString(request.cycle(), "Standard"));
            case "nourriture" -> new Nourriture(nom, marque, etat, connectivite, batterie, piece, defaultFloat(request.niveau(), 50f), defaultString(request.animal(), "Animal"));
            case "eau" -> new Eau(nom, marque, etat, connectivite, batterie, piece, defaultFloat(request.niveau(), 50f), defaultString(request.animal(), "Animal"));
            case "fenetre" -> new Fenetre(nom, marque, etat, connectivite, batterie, piece, defaultInteger(request.position(), 0));
            case "detecteurmouvement" -> new DetecteurMouvement(nom, marque, etat, connectivite, batterie, piece, defaultString(request.zone(), "Zone"));
            case "climatiseur" -> new Climatiseur(nom, marque, etat, connectivite, batterie, piece);
            case "alarme" -> new Alarme(nom, marque, etat, connectivite, batterie, piece);
            case "aspirateur" -> new Aspirateur(nom, marque, etat, connectivite, batterie, piece);
            default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Type objet non supporté: " + request.type());
        };
    }

    private void applyCommon(ObjetConnecte objet, GestionObjetUpsertRequest request, Piece piece) {
        if (request.nom() != null && !request.nom().isBlank()) {
            objet.setNom(request.nom().trim());
        }
        if (request.marque() != null) {
            objet.setMarque(trimToNull(request.marque()));
        }
        if (request.etat() != null && !request.etat().isBlank()) {
            objet.setEtat(parseEtat(request.etat(), objet.getEtat()));
        }
        if (request.connectivite() != null && !request.connectivite().isBlank()) {
            objet.setConnectivite(parseConnectivite(request.connectivite(), objet.getConnectivite()));
        }
        if (request.batterie() != null) {
            objet.setBatterie(request.batterie());
        }
        if (piece != null) {
            objet.setPiece(piece);
        }
    }

    private void applySpecific(ObjetConnecte objet, GestionObjetUpsertRequest request) {
        // Ouvrant — slider de position (0–100)
        if (objet instanceof Ouvrant ouvrant) {
            if (request.position() != null) {
                ouvrant.setPosition(Math.max(0, Math.min(100, request.position())));
            }
            return;
        }

        // Thermostat avant Capteur (sous-classe la plus spécifique d'abord)
        if (objet instanceof Thermostat thermostat) {
            if (request.zone() != null) {
                thermostat.setZone(trimToNull(request.zone()));
            }
            if (request.tempCible() != null) {
                thermostat.setTempCible(request.tempCible());
            }
            if (request.mode() != null && !request.mode().isBlank()) {
                thermostat.setMode(request.mode().trim().toUpperCase(Locale.ROOT));
            }
            return;
        }

        if (objet instanceof Capteur capteur) {
            if (request.zone() != null) {
                capteur.setZone(trimToNull(request.zone()));
            }
            return;
        }

        // LaveLinge — programme + paramètres + commande start/stop cycle
        if (objet instanceof LaveLinge laveLinge) {
            if (request.cycle() != null) {
                laveLinge.setCycle(trimToNull(request.cycle()));
            }
            if (request.consoEnergie() != null) {
                laveLinge.setConsoEnergie(request.consoEnergie());
            }
            if (request.programme() != null && !request.programme().isBlank()) {
                String prog = request.programme().trim().toUpperCase(Locale.ROOT);
                laveLinge.setProgramme(prog);
                // Aligner les paramètres suggérés par le programme si l'UI ne les a pas overridé
                try {
                    LaveLinge.ProgrammeLavage p = LaveLinge.ProgrammeLavage.valueOf(prog);
                    if (request.tempLavage() == null) laveLinge.setTempLavage(p.getTempSuggeree());
                    if (request.vitesseEssorage() == null) laveLinge.setVitesseEssorage(p.getEssorageSuggere());
                } catch (IllegalArgumentException ignored) { /* programme libre */ }
            }
            if (request.tempLavage() != null) {
                laveLinge.setTempLavage(Math.max(0, Math.min(95, request.tempLavage())));
            }
            if (request.vitesseEssorage() != null) {
                laveLinge.setVitesseEssorage(Math.max(0, Math.min(2000, request.vitesseEssorage())));
            }
            if ("start".equalsIgnoreCase(request.cycleAction())) {
                laveLinge.setEtat(Etat.ACTIF);
                laveLinge.demarrerCycle();
            } else if ("stop".equalsIgnoreCase(request.cycleAction())) {
                laveLinge.setEtat(Etat.INACTIF);
                laveLinge.arreterCycle();
            }
            return;
        }

        // Television — chaîne / volume / source
        if (objet instanceof Television television) {
            if (request.cycle() != null) {
                television.setCycle(trimToNull(request.cycle()));
            }
            if (request.consoEnergie() != null) {
                television.setConsoEnergie(request.consoEnergie());
            }
            if (request.chaine() != null) {
                television.setChaine(request.chaine());
            }
            if (request.volume() != null) {
                television.setVolume(request.volume());
            }
            if (request.source() != null && !request.source().isBlank()) {
                television.setSource(request.source().trim().toUpperCase(Locale.ROOT));
            }
            return;
        }

        // Appareil générique (autres feuilles non encore spécialisées)
        if (objet instanceof Appareil appareil) {
            if (request.cycle() != null) {
                appareil.setCycle(trimToNull(request.cycle()));
            }
            if (request.consoEnergie() != null) {
                appareil.setConsoEnergie(request.consoEnergie());
            }
            return;
        }

        // BesoinAnimal — réservoir, animal, portion + commandes distribuer/remplir
        if (objet instanceof BesoinAnimal ba) {
            if (request.niveau() != null) {
                ba.setNiveau(request.niveau());
            }
            if (request.animal() != null) {
                ba.setAnimal(trimToNull(request.animal()));
            }
            if (request.portionGrammes() != null) {
                ba.setPortionGrammes(Math.max(1, Math.min(500, request.portionGrammes())));
            }
            if ("distribuer".equalsIgnoreCase(request.petAction())) {
                ba.distribuer();
            } else if ("remplir".equalsIgnoreCase(request.petAction())) {
                ba.remplir();
            }
        }
    }

    private ObjetConnecte getObjet(Long id) {
        return objetConnecteRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Objet introuvable: " + id));
    }

    private Piece getPieceRequired(Long pieceId) {
        if (pieceId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "pieceId est requis");
        }
        return pieceRepository.findById(pieceId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Pièce introuvable: " + pieceId));
    }

    private static String requiredNom(String nom) {
        if (nom == null || nom.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "nom est requis");
        }
        return nom.trim();
    }

    private static String normalize(String value) {
        return value == null ? null : value.toLowerCase(Locale.ROOT).trim().replace("_", "");
    }

    private static String trimToNull(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private static String csv(Object value) {
        if (value == null) return "";
        String raw = String.valueOf(value);
        String escaped = raw.replace("\"", "\"\"");
        return '"' + escaped + '"';
    }

    private MaintenanceItemDTO toMaintenanceItem(ObjetConnecte objet) {
        List<String> raisons = new ArrayList<>();
        String severite = "LOW";

        Float batterie = objet.getBatterie();
        if (batterie != null) {
            if (batterie < 15f) {
                raisons.add("BATTERIE_CRITIQUE");
                severite = "CRITICAL";
            } else if (batterie < 30f) {
                raisons.add("BATTERIE_FAIBLE");
                severite = maxSeverity(severite, "HIGH");
            }
        }

        Instant derniereMaintenance = objet.getDerniereMaintenance();
        if (derniereMaintenance == null) {
            raisons.add("AUCUNE_REVISION");
            severite = maxSeverity(severite, "HIGH");
        } else {
            long days = Duration.between(derniereMaintenance, Instant.now()).toDays();
            if (days >= 240) {
                raisons.add("REVISION_EN_RETARD_240J");
                severite = maxSeverity(severite, "CRITICAL");
            } else if (days >= 120) {
                raisons.add("REVISION_PERIODIQUE_120J");
                severite = maxSeverity(severite, "MEDIUM");
            }
        }

        if (raisons.isEmpty()) {
            return null;
        }
        return MaintenanceItemDTO.from(objet, severite, raisons);
    }

    private static int maintenancePriority(String sev) {
        if ("CRITICAL".equalsIgnoreCase(sev)) return 3;
        if ("HIGH".equalsIgnoreCase(sev)) return 2;
        if ("MEDIUM".equalsIgnoreCase(sev)) return 1;
        return 0;
    }

    private static String maxSeverity(String current, String incoming) {
        return maintenancePriority(incoming) > maintenancePriority(current) ? incoming : current;
    }

    private static Integer defaultInteger(Integer value, int fallback) {
        return value == null ? fallback : value;
    }

    private static Float defaultFloat(Float value, float fallback) {
        return value == null ? fallback : value;
    }

    private static String defaultString(String value, String fallback) {
        String trimmed = trimToNull(value);
        return trimmed == null ? fallback : trimmed;
    }

    private static Etat parseEtat(String value, Etat fallback) {
        if (value == null || value.isBlank()) {
            return fallback;
        }
        try {
            return Etat.valueOf(value.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Etat invalide: " + value);
        }
    }

    private static Connectivite parseConnectivite(String value, Connectivite fallback) {
        if (value == null || value.isBlank()) {
            return fallback;
        }
        try {
            return Connectivite.valueOf(value.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Connectivite invalide: " + value);
        }
    }
}
