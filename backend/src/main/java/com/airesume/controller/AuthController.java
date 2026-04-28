package com.airesume.controller;

import com.airesume.dto.AuthResponse;
import com.airesume.dto.LoginRequest;
import com.airesume.dto.RegisterRequest;
import com.airesume.entity.User;
import com.airesume.repository.UserRepository;
import com.airesume.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin
public class AuthController {

    private final AuthService authService;
    private final UserRepository userRepository;

    public AuthController(AuthService authService, UserRepository userRepository) {
        this.authService = authService;
        this.userRepository = userRepository;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @GetMapping("/me")
    public ResponseEntity<AuthResponse> me(@RequestAttribute("userId") Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return ResponseEntity.ok(AuthResponse.builder()
                .userId(user.getId())
                .email(user.getEmail())
                .displayName(user.getDisplayName())
                .build());
    }
}

