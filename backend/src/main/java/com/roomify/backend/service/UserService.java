package com.roomify.backend.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.roomify.backend.user.Role;
import com.roomify.backend.user.Staff;
import com.roomify.backend.user.User;
import com.roomify.backend.user.UserRepository;

@Service
@Transactional
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public User createStaffUser(
            String email,
            String passwordHash,
            String name,
            String department
    ) {
  User user = new User(email, passwordHash, Role.STAFF, true);
        Staff staff = new Staff(user, name, department);

        staff.setUser(user);
        user.setStaff(staff);

        return userRepository.save(user);
    }
}
