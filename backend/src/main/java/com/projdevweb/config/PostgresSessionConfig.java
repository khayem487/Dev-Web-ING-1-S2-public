package com.projdevweb.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.session.jdbc.config.annotation.web.http.EnableJdbcHttpSession;
import org.springframework.session.web.http.CookieSerializer;
import org.springframework.session.web.http.DefaultCookieSerializer;

@Configuration(proxyBeanMethods = false)
@Profile("postgres")
@EnableJdbcHttpSession(cleanupCron = "-", maxInactiveIntervalInSeconds = 1800)
public class PostgresSessionConfig {
    @Bean
    CookieSerializer cookieSerializer(@Value("${server.servlet.session.cookie.secure:true}") boolean secure) {
        DefaultCookieSerializer cookie = new DefaultCookieSerializer();
        cookie.setCookieName("JSESSIONID");
        cookie.setUseHttpOnlyCookie(true);
        cookie.setUseSecureCookie(secure);
        cookie.setSameSite("Lax");
        cookie.setCookiePath("/");
        return cookie;
    }
}
