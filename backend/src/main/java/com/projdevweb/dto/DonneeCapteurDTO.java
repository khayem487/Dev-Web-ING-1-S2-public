package com.projdevweb.dto;

import com.projdevweb.model.DonneeCapteur;

import java.time.Instant;

public record DonneeCapteurDTO(
        Long id,
        Instant timestamp,
        String grandeur,
        Float valeur,
        String unite
) {
    public static DonneeCapteurDTO from(DonneeCapteur d) {
        return new DonneeCapteurDTO(
                d.getId(),
                d.getTimestamp(),
                d.getGrandeur(),
                d.getValeur(),
                d.getUnite()
        );
    }
}
