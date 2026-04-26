package com.projdevweb.dto;

import java.time.Instant;

public record NotificationDTO(
        String key,
        String type,
        String severity,
        String message,
        Instant timestamp
) {
}

