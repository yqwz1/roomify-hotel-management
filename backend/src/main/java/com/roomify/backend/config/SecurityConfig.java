package com.roomify.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableMethodSecurity // تفعيل @PreAuthorize
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // Public endpoints
                        .requestMatchers("/api/health").permitAll()
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers("/api/rooms/search").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/rooms/*").permitAll()
                        .requestMatchers("/ws/**").permitAll()

                        // Guest endpoints
                        .requestMatchers("/api/guest/reservations/**").hasRole("GUEST")

                        // باقي endpoints تحتاج Authentication
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public org.springframework.web.cors.CorsConfigurationSource corsConfigurationSource() {

        org.springframework.web.cors.CorsConfiguration configuration =
                new org.springframework.web.cors.CorsConfiguration();

        /*
         * Development CORS origins:
         *
         * localhost / 127.0.0.1:
         * - Used when opening the frontend from the same PC.
         *
         * 192.168.*.*:
         * - Used when opening the frontend from a phone on the same Wi-Fi network.
         *
         * Important:
         * - allowedOriginPatterns is used instead of allowedOrigins because the local IP
         *   may change, for example: 192.168.100.9, 192.168.1.10, etc.
         * - This is suitable for local development.
         * - For production, replace these patterns with the real deployed frontend domain.
         */
        configuration.setAllowedOriginPatterns(java.util.List.of(
                "http://localhost:*",
                "http://127.0.0.1:*",
                "http://192.168.*.*:*"
        ));

        configuration.setAllowedMethods(java.util.List.of(
                "GET",
                "POST",
                "PUT",
                "PATCH",
                "DELETE",
                "OPTIONS"
        ));

        configuration.setAllowedHeaders(java.util.List.of("*"));

        // Useful if the frontend needs to read Authorization or other response headers.
        configuration.setExposedHeaders(java.util.List.of(
                "Authorization"
        ));

        // Keep this true if your frontend sends credentials or Authorization headers.
        configuration.setAllowCredentials(true);

        org.springframework.web.cors.UrlBasedCorsConfigurationSource source =
                new org.springframework.web.cors.UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration("/**", configuration);

        return source;
    }
}