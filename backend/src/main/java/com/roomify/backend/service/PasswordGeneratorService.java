package com.roomify.backend.service;

import java.security.SecureRandom;

import org.springframework.stereotype.Service;

@Service
public class PasswordGeneratorService {

    private static final String UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    private static final String LOWER = "abcdefghijklmnopqrstuvwxyz";
    private static final String DIGITS = "0123456789";
    private static final String SPECIAL = "@#$%^&+=!";
    private static final String ALL = UPPER + LOWER + DIGITS + SPECIAL;
    private static final int DEFAULT_LENGTH = 12;
    private static final int MAX_ATTEMPTS = 10;

    private final SecureRandom random = new SecureRandom();
    private final PasswordValidatorService validator;

    public PasswordGeneratorService(PasswordValidatorService validator) {
        this.validator = validator;
    }

    public String generatePassword() {
        for (int attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
            char[] password = new char[DEFAULT_LENGTH];
            password[0] = randomChar(UPPER);
            password[1] = randomChar(LOWER);
            password[2] = randomChar(DIGITS);
            password[3] = randomChar(SPECIAL);

            for (int i = 4; i < DEFAULT_LENGTH; i++) {
                password[i] = randomChar(ALL);
            }

            shuffle(password);
            String candidate = new String(password);

            try {
                validator.validatePassword(candidate);
                return candidate;
            } catch (IllegalArgumentException ignored) {
                // retry with a new random candidate
            }
        }

        throw new IllegalStateException("Failed to generate a valid password");
    }

    private char randomChar(String pool) {
        return pool.charAt(random.nextInt(pool.length()));
    }

    private void shuffle(char[] chars) {
        for (int i = chars.length - 1; i > 0; i--) {
            int j = random.nextInt(i + 1);
            char tmp = chars[i];
            chars[i] = chars[j];
            chars[j] = tmp;
        }
    }
}
