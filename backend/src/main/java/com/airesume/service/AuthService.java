package com.airesume.service;

import com.airesume.dto.AuthResponse;
import com.airesume.dto.LoginRequest;
import com.airesume.dto.RegisterRequest;
import com.airesume.entity.User;
import com.airesume.repository.UserRepository;
import com.airesume.security.JwtUtil;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;

    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       JwtUtil jwtUtil,
                       AuthenticationManager authenticationManager) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.authenticationManager = authenticationManager;
    }

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already registered");
        }

        User user = User.builder()
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .displayName(request.getName())
                .build();

        user = userRepository.save(user);

        String token = jwtUtil.generateToken(user.getId(), user.getEmail());

        return AuthResponse.builder()
                .token(token)
                .email(user.getEmail())
                .displayName(user.getDisplayName())
                .userId(user.getId())
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getEmail(), request.getPassword()));
        } catch (BadCredentialsException e) {
            throw new RuntimeException("Invalid email or password");
        }

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        String token = jwtUtil.generateToken(user.getId(), user.getEmail());

        return AuthResponse.builder()
                .token(token)
                .email(user.getEmail())
                .displayName(user.getDisplayName())
                .userId(user.getId())
                .build();
    }
}

