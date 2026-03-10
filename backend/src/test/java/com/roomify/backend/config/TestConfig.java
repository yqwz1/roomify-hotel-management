package com.roomify.backend.config;

import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import java.util.Properties;
import org.mockito.Mockito;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.mail.javamail.JavaMailSender;

/**
 * Test configuration to provide mock beans for integration tests.
 */
@TestConfiguration
public class TestConfig {

    @Bean
    @Primary
    public JavaMailSender javaMailSender() {
        JavaMailSender sender = Mockito.mock(JavaMailSender.class);
        Mockito.when(sender.createMimeMessage())
                .thenAnswer(invocation -> new MimeMessage(Session.getInstance(new Properties())));
        return sender;
    }
}