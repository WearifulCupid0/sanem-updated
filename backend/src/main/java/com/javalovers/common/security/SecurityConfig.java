package com.javalovers.common.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CharacterEncodingFilter;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    private final CharacterEncodingFilter characterEncodingFilter;
    private final JwtFilter jwtFilter;

    @Value("${app.cors.allowed-origins:http://localhost:3000,https://localhost}")
    private String allowedOrigins;

    public SecurityConfig(CharacterEncodingFilter characterEncodingFilter, JwtFilter jwtFilter) {
        this.characterEncodingFilter = characterEncodingFilter;
        this.jwtFilter = jwtFilter;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .addFilterBefore(characterEncodingFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class)
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers("/auth/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/user/me/consent").authenticated()
                        .requestMatchers(HttpMethod.DELETE, "/user/me/consent").authenticated()
                        .requestMatchers("/user/**", "/profile/**", "/withdrawal-limit-config/**")
                            .hasRole("ADMINISTRATOR")
                        .requestMatchers(HttpMethod.DELETE,
                                "/donation/**", "/donor/**", "/item/**", "/category/**",
                                "/withdrawal/**", "/card/**")
                            .hasRole("ADMINISTRATOR")
                        .requestMatchers("/donation/**", "/donor/**", "/item/**", "/category/**",
                                "/withdrawal/**", "/card/**")
                            .hasAnyRole("ADMINISTRATOR", "COLLABORATOR")
                        .requestMatchers(HttpMethod.DELETE, "/beneficiary/**")
                            .hasRole("ADMINISTRATOR")
                        .requestMatchers(HttpMethod.GET, "/beneficiary/**")
                            .hasAnyRole("ADMINISTRATOR", "COLLABORATOR", "EVALUATOR")
                        .requestMatchers("/beneficiary/*/approve", "/beneficiary/*/reject")
                            .hasAnyRole("ADMINISTRATOR", "EVALUATOR")
                        .requestMatchers("/beneficiary/**")
                            .hasAnyRole("ADMINISTRATOR", "COLLABORATOR")
                        .anyRequest().hasAuthority("ROLE_PRIVACY_ACCEPTED"));

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        List<String> origins = Arrays.stream(allowedOrigins.split(","))
                .map(String::trim)
                .filter(origin -> !origin.isEmpty())
                .toList();
        configuration.setAllowedOrigins(origins);
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"));
        configuration.setAllowedHeaders(List.of("Authorization", "Content-Type", "Accept"));
        configuration.setExposedHeaders(List.of("Authorization", "Content-Type", "X-Total-Count"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public BCryptPasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
