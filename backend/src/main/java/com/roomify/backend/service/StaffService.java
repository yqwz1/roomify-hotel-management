package com.roomify.backend.service;

import java.util.List;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.roomify.backend.dto.StaffCreateRequest;
import com.roomify.backend.dto.StaffResponse;
import com.roomify.backend.dto.StaffUpdateRequest;
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
    private final PasswordEncoder passwordEncoder;

    public StaffService(
            StaffRepository staffRepository,
            UserRepository userRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.staffRepository = staffRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public StaffResponse createStaff(StaffCreateRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ResourceConflictException("Email already exists");
        }

        String passwordHash = passwordEncoder.encode(request.getPassword());
        User user = new User(request.getEmail(), passwordHash, Role.STAFF, true);
        Staff staff = new Staff(user, request.getName(), request.getDepartment());

        staff.setUser(user);
        user.setStaff(staff);

        User savedUser = userRepository.save(user);
        return StaffResponse.from(savedUser.getStaff());
    }

    //  Unified list + search + filter
    @Transactional(readOnly = true)
    public List<StaffResponse> searchStaff(
            String search,
            Role role,
            String department,
            Boolean active
    ) {
        return staffRepository.searchStaff(
                normalize(search),
                role,
                normalize(department),
                active
        ).stream()
         .map(StaffResponse::from)
         .toList();
    }

    private String normalize(String value) {
        return (value == null || value.isBlank()) ? null : value;
    }

    public StaffResponse updateStaff(Long id, StaffUpdateRequest request) {
        Staff staff = staffRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Staff not found"));

        staff.setName(request.getName());
        staff.setDepartment(request.getDepartment());

        return StaffResponse.from(staff);
    }

    public StaffResponse setActive(Long id, boolean active) {
        Staff staff = staffRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Staff not found"));

        staff.setActive(active);
        if (staff.getUser() != null) {
            staff.getUser().setActive(active);
        }

        return StaffResponse.from(staff);
    }
}
