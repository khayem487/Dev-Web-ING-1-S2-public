package com.projdevweb.dto;

import java.util.List;

public record GestionStatsDTO(
        long totalObjets,
        long actifs,
        long inactifs,
        List<PieceCountDTO> parPiece,
        List<ServiceSummaryDTO> parService,
        long actionsHistorique
) {
    public record PieceCountDTO(String piece, long objets) {
    }
}
