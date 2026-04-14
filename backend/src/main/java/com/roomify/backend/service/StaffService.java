package com.roomify.backend.service;

import java.util.List;
import java.util.Locale;

import org.springframework.mail.MailException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.roomify.backend.dto.StaffCreateRequest;
import com.roomify.backend.dto.StaffResponse;
import com.roomify.backend.dto.StaffUpdateRequest;
import com.roomify.backend.exception.EmailDeliveryException;
import com.roomify.backend.exception.ResourceConflictException;
import com.roomify.backend.exception.ResourceNotFoundException;
import com.roomify.backend.user.Role;
import com.roomify.backend.user.Staff;
import com.roomify.backend.user.StaffRepository;
import com.roomify.backend.user.User;
import com.roomify.backend.user.UserRepository;

@Service
@Transactional
public class StaffService {

    private final StaffRepository staffRepository;
    private final UserRepository userRepository;
    private final UserService userService;
    private final PasswordGeneratorService passwordGeneratorService;
    private final EmailService emailService;
    private final AuditService auditService;

    public StaffService(
            StaffRepository staffRepository,
            UserRepository userRepository,
            UserService userService,
            PasswordGeneratorService passwordGeneratorService,
            EmailService emailService,
            AuditService auditService) {
        this.staffRepository = staffRepository;
        this.userRepository = userRepository;
        this.userService = userService;
        this.passwordGeneratorService = passwordGeneratorService;
        this.emailService = emailService;
        this.auditService = auditService;
    }

    public StaffResponse createStaff(StaffCreateRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ResourceConflictException("Email already exists");
        }

        String plainPassword = passwordGeneratorService.generatePassword();

        User savedUser = userService.createStaffUser(
                request.getEmail(),
                plainPassword,
                request.getName(),
                request.getDepartment());

        sendWelcomeEmail(savedUser, plainPassword);

        // Audit log for staff creation
        auditService.log(
                getCurrentActor(),
                "STAFF_CREATED",
                "Staff:" + savedUser.getEmail(),
                "{ \"department\": \"" + request.getDepartment() + "\" }");

        return StaffResponse.from(savedUser.getStaff());
    }

    @Transactional(readOnly = true)
    public List<StaffResponse> searchStaff(String search, Role role, String department, Boolean active) {
        String normalizedSearch = normalize(search);
        String normalizedDepartment = normalize(department);

        return staffRepository.findAll().stream()
                .filter(staff -> matchesSearch(staff, normalizedSearch))
                .filter(staff -> role == null || (staff.getUser() != null && staff.getUser().getRole() == role))
                .filter(staff -> normalizedDepartment == null || normalizedDepartment.equals(staff.getDepartment()))
                .filter(staff -> active == null || staff.isActive() == active)
                .map(StaffResponse::from)
                .toList();
    }

    private String normalize(String value) {
        return (value == null || value.isBlank()) ? null : value;
    }

    private boolean matchesSearch(Staff staff, String search) {
        if (search == null) {
            return true;
        }

        String keyword = search.toLowerCase(Locale.ROOT);
        String name = staff.getName() != null ? staff.getName().toLowerCase(Locale.ROOT) : "";
        String email = staff.getUser() != null && staff.getUser().getEmail() != null
                ? staff.getUser().getEmail().toLowerCase(Locale.ROOT)
                : "";

        return name.contains(keyword) || email.contains(keyword);
    }

    public StaffResponse updateStaff(Long id, StaffUpdateRequest request) {
        Staff staff = staffRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Staff not found"));

        staff.setName(request.getName());
        staff.setDepartment(request.getDepartment());

        // Audit log for staff update
        auditService.log(
                getCurrentActor(),
                "STAFF_UPDATED",
                "Staff:" + id,
                "{ \"name\": \"" + request.getName() + "\", \"department\": \"" + request.getDepartment() + "\" }");

        return StaffResponse.from(staff);
    }

    public StaffResponse setActive(Long id, boolean active) {
        Staff staff = staffRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Staff not found"));

        if (!active && isCurrentUser(staff)) {
            throw new ResourceConflictException("You cannot deactivate your own account");
        }

        staff.setActive(active);
        if (staff.getUser() != null) {
            staff.getUser().setActive(active);
        }

        // Audit log for activate/deactivate
        auditService.log(
                getCurrentActor(),
                active ? "STAFF_ACTIVATED" : "STAFF_DEACTIVATED",
                "Staff:" + id,
                "{ \"active\": " + active + " }");

        return StaffResponse.from(staff);
    }

    private void sendWelcomeEmail(User user, String plainPassword) {
        try {
            String name = user.getStaff() != null ? user.getStaff().getName() : null;
            emailService.sendStaffWelcomeEmail(user.getEmail(), name, plainPassword);
        } catch (MailException ex) {
            throw new EmailDeliveryException("Failed to send account email. Please try again.", ex);
        }
    }

    private boolean isCurrentUser(Staff staff) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return false;
        }
        String currentEmail = authentication.getName();
        User user = staff.getUser();
        return user != null && user.getEmail() != null && user.getEmail().equalsIgnoreCase(currentEmail);
    }

    private String getCurrentActor() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return "SYSTEM";
        }
        return authentication.getName();
    }
}
