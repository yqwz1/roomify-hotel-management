package com.roomify.backend.service;

import com.roomify.backend.dto.RegisterRequest;
import com.roomify.backend.dto.RegisterResponse;
import com.roomify.backend.entity.Guest;
import com.roomify.backend.exception.DuplicateResourceException;
import com.roomify.backend.repository.GuestRepository;
import com.roomify.backend.user.Role;
import com.roomify.backend.user.User;
import com.roomify.backend.user.UserRepository;
import java.util.Locale;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class GuestRegistrationService {

    private static final Logger log = LoggerFactory.getLogger(GuestRegistrationService.class);
    private static final String PENDING_PHONE = "PENDING";
    private static final String PENDING_NATIONALITY = "UNKNOWN";

    private final UserRepository userRepository;
    private final GuestRepository guestRepository;
    private final PasswordEncoder passwordEncoder;
    private final PasswordValidatorService passwordValidatorService;
    private final EmailService emailService;

    public GuestRegistrationService(
            UserRepository userRepository,
            GuestRepository guestRepository,
            PasswordEncoder passwordEncoder,
            PasswordValidatorService passwordValidatorService,
            EmailService emailService) {
        this.userRepository = userRepository;
        this.guestRepository = guestRepository;
        this.passwordEncoder = passwordEncoder;
        this.passwordValidatorService = passwordValidatorService;
        this.emailService = emailService;
    }

    @Transactional
    public RegisterResponse register(RegisterRequest request) {
        String email = normalizeEmail(request.getEmail());
        String name = normalizeRequired(request.getName());

        passwordValidatorService.validatePassword(request.getPassword());
        rejectDuplicateEmail(email);

        User savedUser;
        Guest savedGuest;
        try {
            User user = new User(email, passwordEncoder.encode(request.getPassword()), Role.GUEST, true);
            savedUser = userRepository.save(user);

            Guest guest = new Guest();
            guest.setName(name);
            guest.setEmail(email);
            guest.setPhone(PENDING_PHONE);
            guest.setIdNumber("SELF-" + savedUser.getId());
            guest.setNationality(PENDING_NATIONALITY);
            savedGuest = guestRepository.save(guest);
        } catch (DataIntegrityViolationException ex) {
            throw new DuplicateResourceException("An account with this email already exists");
        }

        sendGuestWelcomeEmail(savedGuest);

        return new RegisterResponse(
                savedUser.getId(),
                savedGuest.getId(),
                savedGuest.getName(),
                savedUser.getEmail(),
                savedUser.getRoles().stream()
                        .map(role -> "ROLE_" + role.name())
                        .toList());
    }

    private void sendGuestWelcomeEmail(Guest guest) {
        try {
            emailService.sendGuestWelcomeEmail(guest.getEmail(), guest.getName());
        } catch (RuntimeException ex) {
            log.warn("Failed to queue guest welcome email for {}", guest.getEmail(), ex);
        }
    }

    private void rejectDuplicateEmail(String email) {
        if (userRepository.findByEmailIgnoreCase(email).isPresent()
                || guestRepository.findByEmailIgnoreCase(email).isPresent()) {
            throw new DuplicateResourceException("An account with this email already exists");
        }
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private String normalizeRequired(String value) {
        return value.trim();
    }
}
