package com.roomify.backend;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.password.PasswordEncoder;

@SpringBootApplication
public class RoomifyBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(RoomifyBackendApplication.class, args);
    }

    @Bean
    CommandLineRunner generateHash(PasswordEncoder encoder) {
        return args -> {
            System.out.println("HASH = " + encoder.encode("password123"));
        };
    }
}