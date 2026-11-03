package com.javalovers.core.appuser.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class DatabaseInitializer implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        // Schema and development seed data are managed by Flyway migrations.
        // Do not execute the legacy SQL files here: they target the pre-V8 schema.
        Integer userCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM app_user",
                Integer.class
        );

        if (userCount == null || userCount == 0) {
            log.warn("Nenhum usuário foi encontrado. Verifique a execução das migrations Flyway, especialmente V7.");
            return;
        }

        log.info("Banco inicializado pelo Flyway. {} usuário(s) encontrado(s).", userCount);
    }
}
