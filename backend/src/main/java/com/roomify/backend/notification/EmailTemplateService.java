package com.roomify.backend.notification;

import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.util.HtmlUtils;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

@Service
public class EmailTemplateService {

    private final TemplateEngine templateEngine;

    public EmailTemplateService(TemplateEngine templateEngine) {
        this.templateEngine = templateEngine;
    }

    public String render(NotificationEvent event) {
        Context context = new Context(resolveLocale(event.locale()));
        context.setVariables(sanitizeModel(event.templateModel()));
        context.setVariable("brandName", "Roomify");
        context.setVariable("localeTag", normalizeLocale(event.locale()));
        context.setVariable("rtl", isArabic(event.locale()));
        return templateEngine.process(event.templateName(), context);
    }

    public Map<String, Object> sanitizeModel(Map<String, Object> source) {
        Map<String, Object> sanitized = new LinkedHashMap<>();
        if (source == null) {
            return sanitized;
        }

        source.forEach((key, value) -> {
            if (value instanceof String stringValue) {
                sanitized.put(key, sanitizeText(stringValue));
            } else {
                sanitized.put(key, value);
            }
        });
        return sanitized;
    }

    public String sanitizeText(String value) {
        if (!StringUtils.hasText(value)) {
            return "";
        }

        String normalized = value
                .replaceAll("[\\p{Cntrl}&&[^\r\n\t]]", "")
                .trim();
        return HtmlUtils.htmlEscape(normalized);
    }

    public String normalizeLocale(String localeTag) {
        return isArabic(localeTag) ? "ar" : "en";
    }

    public boolean isArabic(String localeTag) {
        return localeTag != null && localeTag.toLowerCase(Locale.ROOT).startsWith("ar");
    }

    private Locale resolveLocale(String localeTag) {
        if (!StringUtils.hasText(localeTag)) {
            return Locale.ENGLISH;
        }
        Locale locale = Locale.forLanguageTag(localeTag);
        return locale == null ? Locale.ENGLISH : locale;
    }
}
