package com.projdevweb.controller;

import com.projdevweb.dto.GestionEtatRequest;
import com.projdevweb.dto.GestionHistoriqueDTO;
import com.projdevweb.dto.GestionObjetDetailDTO;
import com.projdevweb.dto.GestionObjetUpsertRequest;
import com.projdevweb.dto.GestionStatsDTO;
import com.projdevweb.dto.ObjetConnecteDTO;
import com.projdevweb.dto.ServiceSummaryDTO;
import com.projdevweb.model.Camera;
import com.projdevweb.model.Capteur;
import com.projdevweb.model.Connectivite;
import com.projdevweb.model.Eau;
import com.projdevweb.model.Etat;
import com.projdevweb.model.GestionHistorique;
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
import com.projdevweb.repository.GestionHistoriqueRepository;
import com.projdevweb.repository.ObjetConnecteRepository;
import com.projdevweb.repository.PieceRepository;
import com.projdevweb.repository.UtilisateurRepository;
import com.projdevweb.service.SessionUtilisateurService;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
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

import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/gestion")
public class GestionController {

    private final ObjetConnecteRepository objetConnecteRepository;
    private final PieceRepository pieceRepository;
    private final GestionHistoriqueRepository gestionHistoriqueRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final SessionUtilisateurService sessionUtilisateurService;

    public GestionController(ObjetConnecteRepository objetConnecteRepository,
                             PieceRepository pieceRepository,
                             GestionHistoriqueRepository gestionHistoriqueRepository,
                             UtilisateurRepository utilisateurRepository,
                             SessionUtilisateurService sessionUtilisateurService) {
        this.objetConnecteRepository = objetConnecteRepository;
        this.pieceRepository = pieceRepository;
        this.gestionHistoriqueRepository = gestionHistoriqueRepository;
        this.utilisateurRepository = utilisateurRepository;
        this.sessionUtilisateurService = sessionUtilisateurService;
    }

    @GetMapping("/objets")
    public List<ObjetConnecteDTO> objets(HttpSession session) {
        sessionUtilisateurService.requireUser(session);
        return objetConnecteRepository.findAll().stream().map(ObjetConnecteDTO::from).toList();
    }

    @GetMapping("/objets/{id}")
    public GestionObjetDetailDTO objetDetail(@PathVariable Long id, HttpSession session) {
        sessionUtilisateurService.requireUser(session);
        ObjetConnecte objet = getObjet(id);
        return GestionObjetDetailDTO.from(objet);
    }

    @PostMapping("/objets")
    public GestionObjetDetailDTO createObjet(@Valid @RequestBody GestionObjetUpsertRequest request,
                                             HttpSession session) {
        Utilisateur utilisateur = sessionUtilisateurService.requireUser(session);
        Piece piece = getPieceRequired(request.pieceId());

        ObjetConnecte objet = buildByType(request, piece);
        applyCommon(objet, request, piece);
        applySpecific(objet, request);

        ObjetConnecte saved = objetConnecteRepository.save(objet);

        utilisateur.addPoints(8);
        utilisateurRepository.save(utilisateur);

        logAction("CREATE", saved, utilisateur, "Création objet connecté");
        return GestionObjetDetailDTO.from(saved);
    }

    @PutMapping("/objets/{id}")
    public GestionObjetDetailDTO updateObjet(@PathVariable Long id,
                                             @Valid @RequestBody GestionObjetUpsertRequest request,
                                             HttpSession session) {
        Utilisateur utilisateur = sessionUtilisateurService.requireUser(session);
        ObjetConnecte objet = getObjet(id);

        Piece piece = request.pieceId() != null ? getPieceRequired(request.pieceId()) : objet.getPiece();

        applyCommon(objet, request, piece);
        applySpecific(objet, request);

        ObjetConnecte saved = objetConnecteRepository.save(objet);

        utilisateur.addPoints(4);
        utilisateurRepository.save(utilisateur);

        logAction("UPDATE", saved, utilisateur, "Mise à jour paramètres objet");
        return GestionObjetDetailDTO.from(saved);
    }

    @PatchMapping("/objets/{id}/etat")
    public GestionObjetDetailDTO toggleEtat(@PathVariable Long id,
                                            @RequestBody GestionEtatRequest request,
                                            HttpSession session) {
        Utilisateur utilisateur = sessionUtilisateurService.requireUser(session);
        ObjetConnecte objet = getObjet(id);

        objet.setEtat(request.actif() ? Etat.ACTIF : Etat.INACTIF);
        ObjetConnecte saved = objetConnecteRepository.save(objet);

        utilisateur.addPoints(2);
        utilisateurRepository.save(utilisateur);

        logAction("TOGGLE_ETAT", saved, utilisateur, "Etat -> " + saved.getEtat());
        return GestionObjetDetailDTO.from(saved);
    }

    @DeleteMapping("/objets/{id}")
    public Map<String, Object> deleteObjet(@PathVariable Long id, HttpSession session) {
        Utilisateur utilisateur = sessionUtilisateurService.requireUser(session);
        ObjetConnecte objet = getObjet(id);

        String details = "Suppression objet";
        logAction("DELETE", objet, utilisateur, details);

        objetConnecteRepository.delete(objet);

        utilisateur.addPoints(3);
        utilisateurRepository.save(utilisateur);

        return Map.of("ok", true, "deletedId", id);
    }

    @GetMapping("/stats")
    public GestionStatsDTO stats(HttpSession session) {
        sessionUtilisateurService.requireUser(session);

        List<ObjetConnecteDTO> objets = objetConnecteRepository.findAll().stream()
                .map(ObjetConnecteDTO::from)
                .toList();

        long total = objets.size();
        long actifs = objets.stream().filter(o -> o.etat() == Etat.ACTIF).count();
        long inactifs = total - actifs;

        List<GestionStatsDTO.PieceCountDTO> parPiece = objets.stream()
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
                gestionHistoriqueRepository.count()
        );
    }

    @GetMapping("/historique")
    public List<GestionHistoriqueDTO> historique(@RequestParam(defaultValue = "25") int limit,
                                                  HttpSession session) {
        sessionUtilisateurService.requireUser(session);
        int safeLimit = Math.max(1, Math.min(limit, 100));
        return gestionHistoriqueRepository.findAll(PageRequest.of(0, safeLimit, Sort.by(Sort.Direction.DESC, "timestamp")))
                .getContent().stream()
                .map(GestionHistoriqueDTO::from)
                .toList();
    }

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
        if (objet instanceof Ouvrant ouvrant) {
            if (request.position() != null) {
                ouvrant.setPosition(request.position());
            }
            return;
        }

        if (objet instanceof Capteur capteur) {
            if (request.zone() != null) {
                capteur.setZone(trimToNull(request.zone()));
            }
            return;
        }

        if (objet instanceof Television television) {
            if (request.cycle() != null) {
                television.setCycle(trimToNull(request.cycle()));
            }
            if (request.consoEnergie() != null) {
                television.setConsoEnergie(request.consoEnergie());
            }
            return;
        }

        if (objet instanceof LaveLinge laveLinge) {
            if (request.cycle() != null) {
                laveLinge.setCycle(trimToNull(request.cycle()));
            }
            if (request.consoEnergie() != null) {
                laveLinge.setConsoEnergie(request.consoEnergie());
            }
            return;
        }

        if (objet instanceof Nourriture nourriture) {
            if (request.niveau() != null) {
                nourriture.setNiveau(request.niveau());
            }
            if (request.animal() != null) {
                nourriture.setAnimal(trimToNull(request.animal()));
            }
            return;
        }

        if (objet instanceof Eau eau) {
            if (request.niveau() != null) {
                eau.setNiveau(request.niveau());
            }
            if (request.animal() != null) {
                eau.setAnimal(trimToNull(request.animal()));
            }
        }
    }

    private void logAction(String action, ObjetConnecte objet, Utilisateur utilisateur, String details) {
        GestionHistorique entry = new GestionHistorique(
                action,
                objet.getId(),
                objet.getNom(),
                objet.getClass().getSimpleName(),
                objet.getPiece() != null ? objet.getPiece().getNom() : null,
                utilisateur.getEmail(),
                details
        );
        gestionHistoriqueRepository.save(entry);
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
