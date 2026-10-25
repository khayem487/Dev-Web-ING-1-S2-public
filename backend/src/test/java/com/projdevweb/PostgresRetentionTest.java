package com.projdevweb;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.projdevweb.model.*;
import com.projdevweb.repository.*;
import com.projdevweb.service.PasswordService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfSystemProperty;
import org.flywaydb.core.Flyway;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.boot.web.context.WebServerApplicationContext;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.jdbc.core.JdbcTemplate;

import java.net.CookieManager;
import java.net.CookiePolicy;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.sql.DriverManager;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/** Opt-in real-engine test. Creates and drops only its own uniquely named loopback schema. */
@EnabledIfSystemProperty(named = "smartHome.test.postgresUrl", matches = ".+")
class PostgresRetentionTest {
    private final ObjectMapper json = new ObjectMapper();

    @Test void restartRetainsAccountsPhotoObjectsScenariosAndAuthenticatedCookie() throws Exception {
        String url = System.getProperty("smartHome.test.postgresUrl");
        URI uri = URI.create(url.substring("jdbc:".length()));
        assertThat(uri.getHost()).isIn("127.0.0.1", "localhost", "[::1]");
        String user = System.getProperty("smartHome.test.postgresUser", "postgres");
        String password = System.getProperty("smartHome.test.postgresPassword", "postgres");
        String schema = "smart_home_retention_" + UUID.randomUUID().toString().replace("-", "");
        try (var db = DriverManager.getConnection(url, user, password); var statement = db.createStatement()) {
            statement.execute("create schema " + schema);
        }
        String isolatedUrl = url + (url.contains("?") ? "&" : "?") + "currentSchema=" + schema;
        CookieManager cookies = new CookieManager(null, CookiePolicy.ACCEPT_ALL);
        HttpClient client = HttpClient.newBuilder().cookieHandler(cookies).build();
        String photo = "data:image/png;base64," + "aGVsbG8=".repeat(12000);
        Instant repaired = Instant.now().truncatedTo(ChronoUnit.MILLIS);
        long accountId;
        long deviceId;
        long scenarioId;
        long thermostatId;
        long climateId;
        long initialDeviceCount;
        long initialUserCount;
        try {
            try (var first = start(isolatedUrl, user, password)) {
                JdbcTemplate db = first.getBean(JdbcTemplate.class);
                var users = first.getBean(UtilisateurRepository.class);
                var objects = first.getBean(ObjetConnecteRepository.class);
                var account = new ParentFamille("Retention", "Test", "retained@example.test",
                        first.getBean(PasswordService.class).hash("retention-password"));
                account.setPhotoDataUrl(photo);
                account.addPoints(15f);
                accountId = users.saveAndFlush(account).getId();
                ObjetConnecte aspirateur = objects.findAll().stream().filter(o -> o instanceof Aspirateur).findFirst().orElseThrow();
                aspirateur.setBatterie(95f);
                aspirateur.setDerniereMaintenance(repaired);
                deviceId = objects.saveAndFlush(aspirateur).getId();
                Thermostat thermostat = (Thermostat) objects.findAll().stream().filter(o -> o instanceof Thermostat).findFirst().orElseThrow();
                thermostat.setTempCible(20.5f);
                for (Thermostat.ModeThermostat mode : Thermostat.ModeThermostat.values()) {
                    thermostat.setMode(mode.name());
                    objects.saveAndFlush(thermostat);
                    assertThat(((Thermostat) objects.findById(thermostat.getId()).orElseThrow()).getMode()).isEqualTo(mode.name());
                }
                thermostat.setMode(Thermostat.ModeThermostat.ECO.name());
                thermostatId = objects.saveAndFlush(thermostat).getId();
                Climatiseur climate = (Climatiseur) objects.findAll().stream().filter(o -> o instanceof Climatiseur).findFirst().orElseThrow();
                climate.setTempCible(23);
                climate.setModeClim(Climatiseur.ModeClim.CHAUD.name());
                climateId = objects.saveAndFlush(climate).getId();
                var scenario = new Scenario("Retained scenario", "R", ScenarioType.MANUAL);
                scenario.addAction(new ScenarioAction(aspirateur, Etat.INACTIF, null));
                scenarioId = first.getBean(ScenarioRepository.class).saveAndFlush(scenario).getId();
                initialDeviceCount = objects.count();
                initialUserCount = users.count();
                assertThat(db.queryForObject("select data_type from information_schema.columns where table_schema = ? and table_name = 'utilisateur' and column_name = 'photo_data_url'", String.class, schema)).isEqualTo("text");
                assertThat(db.queryForObject("select count(*) from flyway_schema_history where success", Long.class)).isEqualTo(3);
                assertThat(db.queryForObject("select count(*) from app_seed", Long.class)).isEqualTo(1);
                assertThat(send(client, first, "/api/auth/login", "{\"email\":\"retained@example.test\",\"motDePasse\":\"retention-password\"}").statusCode()).isEqualTo(200);
                assertThat(cookies.getCookieStore().getCookies()).anyMatch(c -> c.getName().equals("JSESSIONID") && c.isHttpOnly());
                assertThat(db.queryForObject("select count(*) from spring_session_attributes where attribute_name = 'SESSION_USER_ID'", Long.class)).isEqualTo(1);
            }
            try (var second = start(isolatedUrl, user, password)) {
                var users = second.getBean(UtilisateurRepository.class);
                var objects = second.getBean(ObjetConnecteRepository.class);
                assertThat(users.findById(accountId).orElseThrow().getPhotoDataUrl()).isEqualTo(photo);
                ObjetConnecte retained = objects.findById(deviceId).orElseThrow();
                assertThat(retained.getBatterie()).isEqualTo(95f);
                assertThat(retained.getDerniereMaintenance()).isEqualTo(repaired);
                Thermostat thermostat = (Thermostat) objects.findById(thermostatId).orElseThrow();
                assertThat(thermostat.getTempCible()).isEqualTo(20.5f);
                assertThat(thermostat.getMode()).isEqualTo("ECO");
                Climatiseur climate = (Climatiseur) objects.findById(climateId).orElseThrow();
                assertThat(climate.getTempCible()).isEqualTo(23);
                assertThat(climate.getModeClim()).isEqualTo("CHAUD");
                assertThat(second.getBean(ScenarioRepository.class).findById(scenarioId)).isPresent();
                assertThat(objects.count()).isEqualTo(initialDeviceCount);
                assertThat(users.count()).isEqualTo(initialUserCount);
                var me = send(client, second, "/api/auth/me", null);
                assertThat(me.statusCode()).isEqualTo(200);
                assertThat(json.readTree(me.body()).path("id").asLong()).isEqualTo(accountId);
                // Durable profile keeps the published public-demo boundaries.
                assertThat(send(client, second, "/api/auth/register", "{\"prenom\":\"Test\",\"nom\":\"Test\",\"email\":\"blocked@example.test\",\"motDePasse\":\"password123\"}").statusCode()).isEqualTo(403);
                assertThat(send(client, second, "/api/auth/login", "{\"email\":\"parent@demo.local\",\"motDePasse\":\"demo1234\"}").statusCode()).isEqualTo(200);
                assertThat(send(client, second, "/api/admin/utilisateurs", null).statusCode()).isEqualTo(403);
                assertThat(send(client, second, "/api/visualisation/profile", "{\"prenom\":\"Changed\"}", "PUT").statusCode()).isEqualTo(403);
                var health = json.readTree(send(client, second, "/api/health", null).body());
                assertThat(health.path("storage").asText()).isEqualTo("external-database");
                assertThat(health.path("schedulerEnabled").asBoolean()).isFalse();
                assertThat(send(client, second, "/api/auth/logout", "{}").statusCode()).isEqualTo(200);
                assertThat(send(client, second, "/api/auth/me", null).statusCode()).isEqualTo(401);
                assertThat(send(client, second, "/api/auth/login", "{\"email\":\"parent@demo.local\",\"motDePasse\":\"demo1234\"}").statusCode()).isEqualTo(200);
                second.getBean(JdbcTemplate.class).update("update spring_session set last_access_time = 0, expiry_time = 0");
                assertThat(send(client, second, "/api/auth/me", null).statusCode()).isEqualTo(401);
            }
        } finally {
            try (var db = DriverManager.getConnection(url, user, password); var statement = db.createStatement()) {
                statement.execute("drop schema " + schema + " cascade");
            }
        }
    }

    @Test void versionThreeMigrationCopiesLegacyThermostatTargetsAndKeepsClimateIntegers() throws Exception {
        String url = System.getProperty("smartHome.test.postgresUrl");
        assertThat(URI.create(url.substring("jdbc:".length())).getHost()).isIn("127.0.0.1", "localhost", "[::1]");
        String user = System.getProperty("smartHome.test.postgresUser", "postgres");
        String password = System.getProperty("smartHome.test.postgresPassword", "postgres");
        String schema = "smart_home_upgrade_" + UUID.randomUUID().toString().replace("-", "");
        try (var db = DriverManager.getConnection(url, user, password); var statement = db.createStatement()) {
            statement.execute("create schema " + schema);
        }
        String isolatedUrl = url + (url.contains("?") ? "&" : "?") + "currentSchema=" + schema;
        try {
            Flyway.configure().dataSource(isolatedUrl, user, password).locations("classpath:db/migration/postgres")
                    .cleanDisabled(true).target("2").load().migrate();
            try (var db = DriverManager.getConnection(isolatedUrl, user, password); var statement = db.createStatement()) {
                statement.execute("insert into maison(id, nom) values (1, 'Legacy house')");
                statement.execute("insert into piece(id, maison_id, type_piece, nom) values (1, 1, 'SALON', 'Legacy room')");
                statement.execute("insert into objet_connecte(id, piece_id, type_objet, nom, etat, temp_cible, mode) values (1, 1, 'THERMOSTAT', 'Legacy thermostat', 'ACTIF', 21, 'CHAUFFE')");
                statement.execute("insert into objet_connecte(id, piece_id, type_objet, nom, etat, temp_cible, mode_clim) values (2, 1, 'CLIMATISEUR', 'Legacy climate', 'ACTIF', 24, 'FROID')");
            }
            Flyway.configure().dataSource(isolatedUrl, user, password).locations("classpath:db/migration/postgres")
                    .cleanDisabled(true).load().migrate();
            try (var db = DriverManager.getConnection(isolatedUrl, user, password); var statement = db.createStatement();
                 var rows = statement.executeQuery("select type_objet, temp_cible, thermostat_temp_cible, mode, mode_clim from objet_connecte order by id")) {
                assertThat(rows.next()).isTrue();
                assertThat(rows.getFloat("thermostat_temp_cible")).isEqualTo(21f);
                assertThat(rows.getInt("temp_cible")).isEqualTo(21);
                assertThat(rows.getString("mode")).isEqualTo("CHAUFFE");
                assertThat(rows.next()).isTrue();
                assertThat(rows.getInt("temp_cible")).isEqualTo(24);
                assertThat(rows.getObject("thermostat_temp_cible")).isNull();
                assertThat(rows.getString("mode_clim")).isEqualTo("FROID");
            }
        } finally {
            try (var db = DriverManager.getConnection(url, user, password); var statement = db.createStatement()) {
                statement.execute("drop schema " + schema + " cascade");
            }
        }
    }

    private ConfigurableApplicationContext start(String url, String user, String password) {
        return new SpringApplicationBuilder(MaisonConnectee.class).profiles("vercel-demo", "postgres").run(
                "--server.port=0", "--APP_DATASOURCE_URL=" + url, "--APP_DATASOURCE_USERNAME=" + user,
                "--APP_DATASOURCE_PASSWORD=" + password, "--APP_MIGRATION_DATASOURCE_URL=" + url,
                "--APP_SESSION_COOKIE_SECURE=false", "--spring.main.banner-mode=off",
                "--logging.level.root=WARN");
    }

    private HttpResponse<String> send(HttpClient client, ConfigurableApplicationContext app, String path, String body) throws Exception {
        return send(client, app, path, body, body == null ? "GET" : "POST");
    }

    private HttpResponse<String> send(HttpClient client, ConfigurableApplicationContext app, String path, String body, String method) throws Exception {
        int port = ((WebServerApplicationContext) app).getWebServer().getPort();
        var request = HttpRequest.newBuilder(URI.create("http://127.0.0.1:" + port + path));
        if (body != null) request.header("Content-Type", "application/json");
        request.method(method, body == null ? HttpRequest.BodyPublishers.noBody() : HttpRequest.BodyPublishers.ofString(body));
        return client.send(request.build(), HttpResponse.BodyHandlers.ofString());
    }
}
