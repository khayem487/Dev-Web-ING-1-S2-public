package com.projdevweb.config;

import org.junit.jupiter.api.Test;
import org.springframework.boot.SpringApplication;
import org.springframework.core.env.MapPropertySource;
import org.springframework.core.env.StandardEnvironment;

import java.util.Map;

import static org.assertj.core.api.Assertions.*;

class PostgresEnvironmentPostProcessorTest {
    @Test void normalizesNeonUrlsAndRemovesCredentialsFromJdbcUrls() {
        var result = PostgresEnvironmentPostProcessor.normalize(
                "postgresql://neon%40user:p%40ss%3A%2B+word@ep-example-pooler.neon.tech/neondb?sslmode=require&channel_binding=require",
                null, null, null);
        assertThat(result.username()).isEqualTo("neon@user");
        assertThat(result.password()).isEqualTo("p@ss:++word");
        assertThat(result.url()).isEqualTo("jdbc:postgresql://ep-example-pooler.neon.tech/neondb?sslmode=require&channelBinding=require&prepareThreshold=0");
        assertThat(result.toString()).doesNotContain(result.password(), result.username());
    }

    @Test void enforcesRemoteTlsAndRedactsInvalidUrlErrors() {
        var secure = PostgresEnvironmentPostProcessor.normalize("jdbc:postgresql://ep-example.neon.tech/db", "user", "password", null);
        assertThat(secure.url()).contains("sslmode=require");
        assertThatThrownBy(() -> PostgresEnvironmentPostProcessor.normalize(
                "postgresql://user:secret-password@remote.example/db?sslmode=disable", null, null, null))
                .isInstanceOf(IllegalStateException.class).hasMessageNotContaining("secret-password")
                .hasNoCause();
        assertThatThrownBy(() -> PostgresEnvironmentPostProcessor.normalize(
                "postgresql://user:secret password@remote.example/db", null, null, null))
                .hasMessageNotContaining("secret password").hasNoCause();
    }

    @Test void normalizesJdbcQueryCredentialsAndAllowsLoopbackPostgres() {
        var result = PostgresEnvironmentPostProcessor.normalize(
                "jdbc:postgresql://127.0.0.1:55432/test?user=local&password=test%2Bpass", null, null, null);
        assertThat(result.username()).isEqualTo("local");
        assertThat(result.password()).isEqualTo("test+pass");
        assertThat(result.url()).isEqualTo("jdbc:postgresql://127.0.0.1:55432/test?sslmode=disable&prepareThreshold=0");
    }

    @Test void selectsDirectUrlForFlywayAndDoesNotChangeH2Profile() {
        StandardEnvironment env = new StandardEnvironment();
        env.getPropertySources().addFirst(new MapPropertySource("test", Map.of(
                "DATABASE_URL", "postgresql://u:p@ep-pooler.neon.tech/db",
                "DATABASE_URL_UNPOOLED", "postgresql://u:p@ep.neon.tech/db")));
        var processor = new PostgresEnvironmentPostProcessor();
        processor.postProcessEnvironment(env, new SpringApplication());
        assertThat(env.getProperty("spring.datasource.url")).isNull();
        env.setActiveProfiles("vercel-demo", "postgres");
        processor.postProcessEnvironment(env, new SpringApplication());
        assertThat(env.getProperty("spring.datasource.url")).contains("ep-pooler.neon.tech").doesNotContain("u:p");
        assertThat(env.getProperty("spring.flyway.url")).contains("ep.neon.tech");
    }

    @Test void failsClosedWhenPostgresWasEnabledWithoutAnyDatabase() {
        StandardEnvironment env = new StandardEnvironment();
        env.getPropertySources().remove(StandardEnvironment.SYSTEM_ENVIRONMENT_PROPERTY_SOURCE_NAME);
        env.setActiveProfiles("postgres");
        assertThatThrownBy(() -> new PostgresEnvironmentPostProcessor().postProcessEnvironment(env, new SpringApplication()))
                .isInstanceOf(IllegalStateException.class).hasMessageContaining("set DATABASE_URL");
    }
}
