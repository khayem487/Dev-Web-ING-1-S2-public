package com.projdevweb.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AuthVerifyEmailRequest(
        @NotBlank @Email @Size(max = 160) String email,
        @NotBlank @Size(max = 32) String token
) {
}
