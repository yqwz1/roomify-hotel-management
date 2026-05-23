package com.roomify.backend.controller;

import com.roomify.backend.service.AccountService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/account")
public class AccountController {

    private final AccountService accountService;

    public AccountController(AccountService accountService) {
        this.accountService = accountService;
    }

    @DeleteMapping
    public ResponseEntity<Void> deleteCurrentAccount(Authentication authentication) {
        accountService.softDeleteCurrentUser(authentication.getName());
        return ResponseEntity.noContent().build();
    }
}
