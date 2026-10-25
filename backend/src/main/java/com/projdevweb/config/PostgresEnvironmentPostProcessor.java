package com.projdevweb.config;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.context.config.ConfigDataEnvironmentPostProcessor;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.Ordered;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;
import org.springframework.core.env.Profiles;

import java.net.URI;
import java.net.URLDecoder;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/** Converts provider URLs without ever copying credentials into a JDBC URL or error. */
public final class PostgresEnvironmentPostProcessor implements EnvironmentPostProcessor, Ordered {
    @Override
    public int getOrder() {
        return ConfigDataEnvironmentPostProcessor.ORDER + 1;
    }

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment env, SpringApplication application) {
        if (!env.acceptsProfiles(Profiles.of("postgres"))) return;
        String raw = first(env.getProperty("APP_DATASOURCE_URL"), env.getProperty("DATABASE_URL"),
                env.getProperty("POSTGRES_URL"));
        if (raw == null) {
            String configured = env.getProperty("spring.datasource.url");
            if (configured != null && (configured.startsWith("jdbc:postgresql:")
                    || configured.startsWith("postgresql:") || configured.startsWith("postgres:"))) raw = configured;
        }
        if (raw == null && first(env.getProperty("PGHOST"), env.getProperty("POSTGRES_HOST")) != null) {
            raw = "postgresql://" + first(env.getProperty("PGHOST"), env.getProperty("POSTGRES_HOST"))
                    + ":" + first(env.getProperty("PGPORT"), "5432") + "/"
                    + encode(first(env.getProperty("PGDATABASE"), env.getProperty("POSTGRES_DATABASE"), "neondb"));
        }
        if (raw == null) throw invalid("set DATABASE_URL or APP_DATASOURCE_URL before enabling postgres");
        Connection web = normalize(raw,
                first(env.getProperty("APP_DATASOURCE_USERNAME"), env.getProperty("PGUSER"), env.getProperty("POSTGRES_USER")),
                first(env.getProperty("APP_DATASOURCE_PASSWORD"), env.getProperty("PGPASSWORD"), env.getProperty("POSTGRES_PASSWORD")),
                env.getProperty("PGSSLMODE"));
        String direct = first(env.getProperty("APP_MIGRATION_DATASOURCE_URL"),
                env.getProperty("DATABASE_URL_UNPOOLED"), env.getProperty("POSTGRES_URL_NON_POOLING"));
        Connection migration = direct == null ? web : normalize(direct, web.username(), web.password(), env.getProperty("PGSSLMODE"));
        Map<String, Object> props = new LinkedHashMap<>();
        props.put("spring.datasource.url", web.url());
        props.put("spring.datasource.username", web.username());
        props.put("spring.datasource.password", web.password());
        props.put("spring.flyway.url", migration.url());
        props.put("spring.flyway.user", migration.username());
        props.put("spring.flyway.password", migration.password());
        env.getPropertySources().addFirst(new MapPropertySource("normalizedPostgresConnection", props));
    }

    static Connection normalize(String raw, String fallbackUser, String fallbackPassword, String fallbackSsl) {
        try {
            URI uri = URI.create(raw.startsWith("jdbc:") ? raw.substring(5) : raw);
            if (!Set.of("postgresql", "postgres").contains(uri.getScheme()) || uri.getHost() == null
                    || uri.getRawFragment() != null || uri.getRawPath() == null || uri.getRawPath().length() < 2) {
                throw invalid("expected a PostgreSQL URL containing a host and database name");
            }
            Map<String, String> params = new LinkedHashMap<>();
            if (uri.getRawQuery() != null) {
                for (String entry : uri.getRawQuery().split("&")) {
                    String[] pair = entry.split("=", 2);
                    String name = decode(pair[0]);
                    name = switch (name) {
                        case "channel_binding" -> "channelBinding";
                        case "connect_timeout" -> "connectTimeout";
                        default -> name;
                    };
                    params.put(name, pair.length == 2 ? decode(pair[1]) : "");
                }
            }
            String username = params.remove("user");
            String password = params.remove("password");
            if (uri.getRawUserInfo() != null) {
                String[] credentials = uri.getRawUserInfo().split(":", 2);
                username = decodeUserInfo(credentials[0]);
                if (credentials.length == 2) password = decodeUserInfo(credentials[1]);
            }
            username = first(username, fallbackUser);
            if (password == null) password = fallbackPassword;
            if (username == null || password == null) throw invalid("database username and password are required");
            boolean local = Set.of("localhost", "127.0.0.1", "[::1]", "::1").contains(uri.getHost());
            String ssl = first(params.get("sslmode"), fallbackSsl, local ? "disable" : "require");
            if (!local && !Set.of("require", "verify-ca", "verify-full").contains(ssl)) {
                throw invalid("remote PostgreSQL connections require TLS");
            }
            params.put("sslmode", ssl);
            // Avoid server-side prepared statements with transaction-mode provider pools.
            params.put("prepareThreshold", "0");
            String query = params.entrySet().stream().map(p -> encode(p.getKey()) + "=" + encode(p.getValue()))
                    .collect(Collectors.joining("&"));
            String url = "jdbc:postgresql://" + uri.getHost() + (uri.getPort() < 0 ? "" : ":" + uri.getPort())
                    + uri.getRawPath() + "?" + query;
            return new Connection(url, username, password);
        } catch (RuntimeException ex) {
            // URI parser exceptions include the input, which can contain provider credentials.
            throw invalid("invalid PostgreSQL connection settings; check URL, credentials and TLS mode");
        }
    }

    private static IllegalStateException invalid(String message) {
        return new IllegalStateException("PostgreSQL configuration: " + message);
    }

    private static String first(String... values) {
        for (String value : values) if (value != null && !value.isBlank()) return value;
        return null;
    }

    private static String decode(String value) { return URLDecoder.decode(value, StandardCharsets.UTF_8); }
    private static String decodeUserInfo(String value) { return decode(value.replace("+", "%2B")); }
    private static String encode(String value) { return URLEncoder.encode(value, StandardCharsets.UTF_8); }

    record Connection(String url, String username, String password) {
        @Override public String toString() { return "PostgresConnection[redacted]"; }
    }
}
