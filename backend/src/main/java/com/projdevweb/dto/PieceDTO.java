package com.projdevweb.dto;

import com.projdevweb.model.Piece;

public record PieceDTO(Long id, String nom, String type, Long maisonId) {

    public static PieceDTO from(Piece piece) {
        return new PieceDTO(
                piece.getId(),
                piece.getNom(),
                piece.getClass().getSimpleName(),
                piece.getMaison() != null ? piece.getMaison().getId() : null
        );
    }
}
