package com.projdevweb.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AuthResendVerificationRequest(
        @NotBlank @Email @Size(max = 160) String email
) {
}
