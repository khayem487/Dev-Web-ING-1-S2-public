package com.projdevweb.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SimulateEventRequest(
        @NotBlank @Size(max = 24) String event
) {
}

