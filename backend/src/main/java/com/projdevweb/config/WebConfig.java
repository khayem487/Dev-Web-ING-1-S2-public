package com.projdevweb.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.Arrays;
import java.util.List;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    private final List<String> allowedOriginPatterns;

    public WebConfig(@Value("${app.cors.allowed-origin-patterns:http://localhost:5173,http://127.0.0.1:5173,https://*.onrender.com}") String allowedOriginPatterns) {
        this.allowedOriginPatterns = Arrays.stream(allowedOriginPatterns.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        // No cross-origin policy in the single-domain public deployment.
        // Omitting the mapping avoids Spring's default wildcard + credentials.
        if (allowedOriginPatterns.isEmpty()) {
            return;
        }
        registry.addMapping("/api/**")
                .allowedOriginPatterns(allowedOriginPatterns.toArray(String[]::new))
                .allowedMethods("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true);
    }
}
