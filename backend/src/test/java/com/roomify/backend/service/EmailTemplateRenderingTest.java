package com.roomify.backend.service;

import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.LinkedHashMap;
import java.util.List;
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

    @Test
    void rendersNotificationTemplate() {
        Context context = new Context();
        context.setVariable("brandName", "Roomify");
        context.setVariable("rtl", false);
        context.setVariable("preheader", "Reservation reminder");
        context.setVariable("heroEyebrow", "Check-in reminder");
        context.setVariable("heading", "Your arrival is tomorrow");
        context.setVariable("greeting", "Dear Jane Guest");
        context.setVariable("intro", "We look forward to welcoming you.");
        context.setVariable("accentLabel", "Confirmation number");
        context.setVariable("accentValue", "RSV-REMINDER001");
        context.setVariable("details", new LinkedHashMap<>(java.util.Map.of(
                "Check-in", "2026-06-01",
                "Check-out", "2026-06-03")));
        context.setVariable("bodyLines", List.of(
                "Please bring your confirmation number.",
                "Contact the front desk for late arrival support."));
        context.setVariable("signature", "Roomify Team");
        context.setVariable("footerText", "This is an operational message.");
        context.setVariable("supportEmail", "support@roomify.com");
        context.setVariable("currentYear", "2026");

        String html = templateEngine.process("email/notification-email", context);

        assertTrue(html.contains("RSV-REMINDER001"));
        assertTrue(html.contains("Check-in reminder"));
        assertTrue(html.contains("Roomify Team"));
    }
}
