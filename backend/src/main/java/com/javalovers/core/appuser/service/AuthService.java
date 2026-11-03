package com.javalovers.core.appuser.service;

import com.javalovers.common.security.JwtService;
import com.javalovers.core.appuser.domain.dto.request.LoginRequestDTO;
import com.javalovers.core.appuser.domain.dto.response.LoginResponseDTO;
import com.javalovers.core.appuser.domain.entity.AppUser;
import com.javalovers.core.appuser.repository.AppUserRepository;
import com.javalovers.core.status.Status;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AuthService {

    public static final String PRIVACY_POLICY_VERSION = "SANEM-PRIVACY-1.0";

    private final AppUserRepository appUserRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public LoginResponseDTO authenticate(LoginRequestDTO loginRequest) {
        AppUser user = appUserRepository.findByLogin(loginRequest.getLogin())
                .orElseThrow(() -> new RuntimeException("Usuário ou senha incorretos"));

        if (!passwordEncoder.matches(loginRequest.getPassword(), user.getPasswordHash())) {
            throw new RuntimeException("Usuário ou senha incorretos");
        }
        if (user.getStatus() != Status.ACTIVE || user.getDeletedAt() != null) {
            throw new RuntimeException("Usuário inativo");
        }

        String token = jwtService.generateToken(user.getLogin());
        return new LoginResponseDTO(
                token,
                user.getName(),
                user.getEmail(),
                user.getProfile() == null ? "" : user.getProfile().getName(),
                user.getUserId(),
                Boolean.TRUE.equals(user.getPrivacyConsent()),
                user.getPrivacyConsentVersion()
        );
    }

    public AppUser getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()
                || authentication.getName() == null || "anonymousUser".equals(authentication.getName())) {
            throw new RuntimeException("Usuário não autenticado");
        }
        return appUserRepository.findByLogin(authentication.getName())
                .filter(user -> user.getStatus() == Status.ACTIVE && user.getDeletedAt() == null)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado ou inativo"));
    }

    @Transactional
    public void acceptPrivacyConsent() {
        AppUser user = getCurrentUser();
        user.setPrivacyConsent(true);
        user.setPrivacyConsentAt(LocalDateTime.now());
        user.setPrivacyConsentRevokedAt(null);
        user.setPrivacyConsentVersion(PRIVACY_POLICY_VERSION);
        appUserRepository.save(user);
    }

    @Transactional
    public void revokePrivacyConsent() {
        AppUser user = getCurrentUser();
        user.setPrivacyConsent(false);
        user.setPrivacyConsentRevokedAt(LocalDateTime.now());
        appUserRepository.save(user);
    }

    public boolean validateToken(String token) {
        try {
            String login = jwtService.extractLogin(token);
            return appUserRepository.findByLogin(login)
                    .filter(user -> user.getStatus() == Status.ACTIVE && user.getDeletedAt() == null)
                    .isPresent();
        } catch (Exception e) {
            return false;
        }
    }
}
