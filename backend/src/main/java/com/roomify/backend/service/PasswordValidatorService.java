package com.roomify.backend.service; 

import java.util.regex.Pattern;

import org.springframework.stereotype.Service;

@Service 
public class PasswordValidatorService {

   // This Regex (Regular Expression) ensures the password meets the following security criteria:
    // ^(?=.*[0-9])       -> Must contain at least one digit (0-9)
    // (?=.*[a-z])        -> Must contain at least one lowercase letter (a-z)
    // (?=.*[A-Z])        -> Must contain at least one uppercase letter (A-Z)
    // (?=.*[@#$%^&+=!])  -> Must contain at least one special character (@#$%^&+=!)
    // (?=\S+$)           -> No whitespace allowed in the entire string
    // .{8,}              -> Minimum length of 8 characters
    private static final String PASSWORD_PATTERN = 
        "^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=!])(?=\\S+$).{8,}$";

private static final Pattern PASSWORD_PATTERN_VALIDATOR = Pattern.compile(PASSWORD_PATTERN);
    public void validatePassword(String password) {
        // Check NullPointerException
        if (password == null) {
            throw new IllegalArgumentException("Password cannot be null");
        }

        if (!PASSWORD_PATTERN_VALIDATOR.matcher(password).matches()) {
            throw new IllegalArgumentException(
                "Password must be at least 8 characters long and include upper case, lower case, a number, and a special character."
            );
        }
    }
}