package com.javalovers.core.appuser.controller;

import com.javalovers.common.utils.HttpUtils;
import com.javalovers.core.appuser.domain.dto.request.AppUserFormDTO;
import com.javalovers.core.appuser.domain.dto.request.AppUserUpdateDTO;
import com.javalovers.core.appuser.domain.dto.response.AppUserDTO;
import com.javalovers.core.appuser.domain.entity.AppUser;
import com.javalovers.core.appuser.service.AppUserService;
import com.javalovers.core.appuser.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/user")
@PreAuthorize("hasRole('ADMINISTRATOR')")
public class AppUserController {

    private final AppUserService userService;
    private final AuthService authService;

    @PostMapping("/me/consent")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> acceptPrivacyConsent() {
        authService.acceptPrivacyConsent();
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/me/consent")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> revokePrivacyConsent() {
        authService.revokePrivacyConsent();
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    public ResponseEntity<Page<AppUserDTO>> listPaged(Pageable pageable) {
        Page<AppUser> userPage = userService.list(pageable);
        return ResponseEntity.ok(userService.generateUserDTOPage(userPage));
    }

    @GetMapping("/all")
    public ResponseEntity<List<AppUserDTO>> list() {
        return ResponseEntity.ok(userService.generateUserDTOList(userService.list()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<AppUserDTO> get(@PathVariable Long id) {
        AppUser user = userService.getOrNull(id);
        return user == null
                ? ResponseEntity.notFound().build()
                : ResponseEntity.ok(userService.generateUserDTO(user));
    }

    @PostMapping
    public ResponseEntity<AppUserDTO> create(
            @RequestBody @Valid AppUserFormDTO appUserFormDTO,
            UriComponentsBuilder uriComponentsBuilder
    ) {
        AppUser user = userService.generateUser(appUserFormDTO);
        userService.save(user);
        URI uri = HttpUtils.createURI(uriComponentsBuilder, "user", user.getUserId());
        return ResponseEntity.created(uri).body(userService.generateUserDTO(user));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Void> update(
            @PathVariable Long id,
            @RequestBody @Valid AppUserUpdateDTO appUserUpdateDTO
    ) {
        AppUser user = userService.getOrNull(id);
        if (user == null) return ResponseEntity.notFound().build();
        userService.updateUser(user, appUserUpdateDTO);
        userService.save(user);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        AppUser user = userService.getOrNull(id);
        if (user == null) return ResponseEntity.notFound().build();
        userService.delete(user);
        return ResponseEntity.noContent().build();
    }
}
