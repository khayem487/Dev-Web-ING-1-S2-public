package com.projdevweb.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;

public record ScenarioUpsertRequest(
        @NotBlank @Size(max = 80) String nom,
        @Size(max = 500) String description,
        @Size(max = 16) String icon,
        @NotBlank @Size(max = 16) String type,
        @Size(max = 80) String cron,
        @Size(max = 120) String condition,
        Long triggerObjetId,
        @Size(max = 24) String triggerEvent,
        Boolean enabled,
        List<ScenarioActionRequest> actions
) {

    public record ScenarioActionRequest(
            Long objetId,
            String targetEtat,
            Integer targetPosition
    ) {
    }
}
