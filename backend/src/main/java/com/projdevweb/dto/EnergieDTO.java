package com.projdevweb.dto;

import java.util.List;

public record EnergieDTO(
        double consoTotaleKwh,
        List<PieceConsoDTO> parPiece,
        List<AppareilConsoDTO> topConsommateurs
) {
    public record PieceConsoDTO(String piece, double consoKwh) {}

    public record AppareilConsoDTO(Long objetId, String nom, String piece, double consoKwh) {}
}

