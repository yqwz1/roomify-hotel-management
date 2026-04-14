package com.roomify.backend.service;

import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.context.support.StaticApplicationContext;
import org.thymeleaf.context.Context;
import org.thymeleaf.spring6.SpringTemplateEngine;
import org.thymeleaf.spring6.templateresolver.SpringResourceTemplateResolver;

class EmailTemplateRenderingTest {

    private SpringTemplateEngine templateEngine;

    @BeforeEach
    void setUp() {
        SpringResourceTemplateResolver resolver = new SpringResourceTemplateResolver();
        resolver.setApplicationContext(new StaticApplicationContext());
        resolver.setPrefix("templates/");
        resolver.setSuffix(".html");
        resolver.setTemplateMode("HTML");
        resolver.setCharacterEncoding("UTF-8");
        resolver.setCheckExistence(true);

        templateEngine = new SpringTemplateEngine();
        templateEngine.setTemplateResolver(resolver);
    }

    @Test
    void rendersReceiptEmailTemplate() {
        Context context = new Context();
        context.setVariable("guest", "Jane Guest");
        context.setVariable("confirmationNumber", "RSV-VERIFY1234");
        context.setVariable("receiptNumber", "RCT-VERIFY01");
        context.setVariable("invoiceNumber", "INV-VERIFY01");
        context.setVariable("paymentMethod", "CARD");
        context.setVariable("paymentDate", "2026-04-14T23:15:00");
        context.setVariable("amount", "115.00");

        String html = templateEngine.process("email/receipt-email", context);

        assertTrue(html.contains("Jane Guest"));
        assertTrue(html.contains("RSV-VERIFY1234"));
        assertTrue(html.contains("RCT-VERIFY01"));
        assertTrue(html.contains("INV-VERIFY01"));
        assertTrue(html.contains("115.00"));
    }

    @Test
    void rendersStaffWelcomeEmailTemplate() {
        Context context = new Context();
        context.setVariable("name", "Front Desk Agent");
        context.setVariable("email", "staff@roomify.test");
        context.setVariable("password", "TempPass123!");

        String html = templateEngine.process("email/staff-welcome-email", context);

        assertTrue(html.contains("Front Desk Agent"));
        assertTrue(html.contains("staff@roomify.test"));
        assertTrue(html.contains("TempPass123!"));
    }
}
