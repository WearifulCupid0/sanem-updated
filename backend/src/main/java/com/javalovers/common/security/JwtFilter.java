package com.javalovers.common.security;

import com.javalovers.core.appuser.domain.entity.AppUser;
import com.javalovers.core.appuser.repository.AppUserRepository;
import com.javalovers.core.status.Status;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.text.Normalizer;
import java.util.List;
import java.util.Locale;

@Component
@RequiredArgsConstructor
public class JwtFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final AppUserRepository appUserRepository;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        String authHeader = request.getHeader("Authorization");

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            try {
                String login = jwtService.extractLogin(token);
                AppUser user = appUserRepository.findByLogin(login).orElse(null);

                if (user != null && user.getStatus() == Status.ACTIVE && user.getDeletedAt() == null) {
                    List<SimpleGrantedAuthority> authorities = new java.util.ArrayList<>();
                    String authority = toAuthority(user.getProfile() == null ? null : user.getProfile().getName());
                    // Sem consentimento ativo ou sem perfil reconhecido, o usuário só pode acessar aceite/revogação.
                    if (Boolean.TRUE.equals(user.getPrivacyConsent()) && authority != null) {
                        authorities.add(new SimpleGrantedAuthority("ROLE_PRIVACY_ACCEPTED"));
                        authorities.add(new SimpleGrantedAuthority(authority));
                    }

                    UsernamePasswordAuthenticationToken authentication =
                            new UsernamePasswordAuthenticationToken(login, null, authorities);
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                }
            } catch (JwtException | IllegalArgumentException ignored) {
                SecurityContextHolder.clearContext();
            }
        }

        filterChain.doFilter(request, response);
    }

    private String toAuthority(String profileName) {
        if (profileName == null || profileName.isBlank()) return null;

        String normalized = Normalizer.normalize(profileName, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .trim()
                .toLowerCase(Locale.ROOT);

        if (normalized.contains("admin")) return "ROLE_ADMINISTRATOR";
        if (normalized.contains("attendant") || normalized.contains("colaborador")
                || normalized.contains("collaborator") || normalized.contains("atendente")) {
            return "ROLE_COLLABORATOR";
        }
        if (normalized.contains("evaluator") || normalized.contains("avaliador")) {
            return "ROLE_EVALUATOR";
        }
        return null;
    }
}
