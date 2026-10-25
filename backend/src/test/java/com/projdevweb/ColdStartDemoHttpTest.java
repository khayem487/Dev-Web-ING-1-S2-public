package com.projdevweb;

import org.junit.jupiter.api.Test;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.boot.web.servlet.context.ServletWebServerInitializedEvent;
import org.springframework.context.ApplicationListener;

import java.net.CookieManager;
import java.net.CookiePolicy;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;

class ColdStartDemoHttpTest {
    @Test void firstLoginAtListeningPortSeesCommittedDemoSeedBeforeApplicationReady() {
        AtomicInteger initialLoginStatus = new AtomicInteger();
        AtomicInteger firstProfileStatus = new AtomicInteger();
        ApplicationListener<ServletWebServerInitializedEvent> firstRequest = event -> {
            try {
                int port = event.getWebServer().getPort();
                var cookies = new CookieManager(null, CookiePolicy.ACCEPT_ALL);
                var client = HttpClient.newBuilder().cookieHandler(cookies).connectTimeout(Duration.ofSeconds(5)).build();
                var login = HttpRequest.newBuilder(URI.create("http://127.0.0.1:" + port + "/api/auth/login"))
                        .timeout(Duration.ofSeconds(10)).header("Content-Type", "application/json")
                        .POST(HttpRequest.BodyPublishers.ofString("{\"email\":\"parent@demo.local\",\"motDePasse\":\"demo1234\"}")).build();
                initialLoginStatus.set(client.send(login, HttpResponse.BodyHandlers.ofString()).statusCode());
                var profile = HttpRequest.newBuilder(URI.create("http://127.0.0.1:" + port + "/api/auth/me"))
                        .timeout(Duration.ofSeconds(10)).GET().build();
                firstProfileStatus.set(client.send(profile, HttpResponse.BodyHandlers.ofString()).statusCode());
            } catch (Exception ex) {
                throw new IllegalStateException("Initial real HTTP request failed", ex);
            }
        };
        // This listener runs when Tomcat starts listening, before ApplicationReadyEvent/runners.
        try (var app = new SpringApplicationBuilder(MaisonConnectee.class).profiles("vercel-demo")
                .listeners(firstRequest).run("--server.port=0", "--APP_SESSION_COOKIE_SECURE=false",
                        "--spring.datasource.url=jdbc:h2:mem:cold_" + UUID.randomUUID() + ";MODE=MySQL;DB_CLOSE_DELAY=-1",
                        "--spring.main.banner-mode=off", "--logging.level.root=WARN")) {
            assertThat(initialLoginStatus.get()).as("Login on the first listening-port request").isEqualTo(200);
            assertThat(firstProfileStatus.get()).as("New session immediately authenticates").isEqualTo(200);
        }
    }
}
