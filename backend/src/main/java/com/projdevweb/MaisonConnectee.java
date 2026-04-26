package com.projdevweb;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class MaisonConnectee {

    public static void main(String[] args) {
        SpringApplication.run(MaisonConnectee.class, args);
    }
}