package com.projdevweb.controller;

import com.projdevweb.dto.ObjetConnecteDTO;
import com.projdevweb.dto.PieceDTO;
import com.projdevweb.repository.ObjetConnecteRepository;
import com.projdevweb.repository.PieceRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Locale;

@RestController
@RequestMapping("/api/info")
public class InfoController {

    private final PieceRepository pieceRepository;
    private final ObjetConnecteRepository objetConnecteRepository;

    public InfoController(PieceRepository pieceRepository, ObjetConnecteRepository objetConnecteRepository) {
        this.pieceRepository = pieceRepository;
        this.objetConnecteRepository = objetConnecteRepository;
    }

    @GetMapping("/pieces")
    public List<PieceDTO> pieces() {
        return pieceRepository.findAll().stream()
                .map(PieceDTO::from)
                .toList();
    }

    @GetMapping("/objets")
    public List<ObjetConnecteDTO> objets(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) Long pieceId,
            @RequestParam(required = false) String q
    ) {
        String qNorm = normalize(q);

        return objetConnecteRepository.findAll().stream()
                .map(ObjetConnecteDTO::from)
                .filter(o -> type == null || type.isBlank() ||
                        o.type().equalsIgnoreCase(type) || o.branche().equalsIgnoreCase(type))
                .filter(o -> pieceId == null || pieceId.equals(o.pieceId()))
                .filter(o -> qNorm == null
                        || contains(o.nom(), qNorm)
                        || contains(o.marque(), qNorm)
                        || contains(o.type(), qNorm)
                        || contains(o.branche(), qNorm)
                        || contains(o.pieceNom(), qNorm))
                .toList();
    }

    private static String normalize(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.toLowerCase(Locale.ROOT).trim();
    }

    private static boolean contains(String value, String normalizedSearch) {
        return value != null && value.toLowerCase(Locale.ROOT).contains(normalizedSearch);
    }
}
