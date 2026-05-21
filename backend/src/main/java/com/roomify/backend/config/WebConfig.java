package com.roomify.backend.config;

import com.roomify.backend.entity.ReservationStatus;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.Locale;
import org.springframework.context.annotation.Configuration;
import org.springframework.format.FormatterRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

  @Override
  public void addFormatters(FormatterRegistry registry) {
    registry.addConverter(String.class, LocalDate.class, value -> {
      if (value == null) {
        return null;
      }

      String normalized = value.trim();
      if (normalized.isEmpty()) {
        return null;
      }

      try {
        return LocalDate.parse(normalized);
      } catch (DateTimeParseException ex) {
        throw new IllegalArgumentException("Date values must use yyyy-MM-dd format", ex);
      }
    });

    registry.addConverter(String.class, ReservationStatus.class, value -> {
      if (value == null) {
        return null;
      }

      String normalized = value.trim();
      if (normalized.isEmpty()) {
        return null;
      }

      String canonical = normalized
          .replaceAll("([a-z])([A-Z])", "$1_$2")
          .replace(' ', '_')
          .replace('-', '_')
          .toUpperCase(Locale.ROOT);

      return switch (canonical) {
        case "CHECKEDIN", "CHECKED_IN", "INHOUSE", "IN_HOUSE" -> ReservationStatus.CHECKED_IN;
        case "CHECKEDOUT", "CHECKED_OUT" -> ReservationStatus.CHECKED_OUT;
        case "CANCELED", "CANCELLED" -> ReservationStatus.CANCELLED;
        case "PENDING" -> ReservationStatus.PENDING;
        case "CONFIRMED" -> ReservationStatus.CONFIRMED;
        default -> ReservationStatus.valueOf(canonical);
      };
    });
  }
}
