package com.empresa.sistema.domain.service;

import com.empresa.sistema.api.dto.auth.AuthResponse;
import com.empresa.sistema.api.dto.auth.LoginRequest;
import com.empresa.sistema.domain.entity.AppUser;
import com.empresa.sistema.domain.entity.Headhunter;
import com.empresa.sistema.domain.repository.AppUserRepository;
import com.empresa.sistema.domain.repository.HeadhunterRepository;
import com.empresa.sistema.domain.service.exception.InvalidCredentialsException;
import com.empresa.sistema.domain.service.exception.TooManyRequestsException;
import com.empresa.sistema.security.AuthRateLimiter;
import com.empresa.sistema.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AuthServiceTest {

    private final PasswordEncoder encoder = new BCryptPasswordEncoder(4);
    private final JwtService jwtService = new JwtService("test-secret-with-at-least-32-bytes-1234567890", 60, 7);
    private AppUserRepository repository;
    private HeadhunterRepository headhunterRepository;
    private AuthService service;

    @BeforeEach
    void setUp() {
        repository = mock(AppUserRepository.class);
        headhunterRepository = mock(HeadhunterRepository.class);
        when(repository.findByEmailIgnoreCase(anyString())).thenReturn(Optional.empty());
        service = new AuthService(repository, headhunterRepository, encoder, jwtService, new AuthRateLimiter());
    }

    private AppUser user(boolean active) {
        return AppUser.builder().id(1L).email("ana@camarmo.com").fullName("Ana")
                .passwordHash(encoder.encode("senha-forte-1")).role(AppUser.UserRole.HEADHUNTER)
                .headhunterId(9L).active(active).build();
    }

    @Test
    void loginReturnsJwtAndUserOnValidCredentials() {
        when(repository.findByEmailIgnoreCase("ana@camarmo.com")).thenReturn(Optional.of(user(true)));

        AuthResponse response = service.login(new LoginRequest("  Ana@Camarmo.com ", "senha-forte-1", false));

        assertThat(response.token()).isNotBlank();
        assertThat(response.tokenType()).isEqualTo("Bearer");
        assertThat(jwtService.parseUserId(response.token())).contains(1L);
        assertThat(response.user().role()).isEqualTo("HEADHUNTER");
        assertThat(response.user().headhunterId()).isEqualTo(9L);
    }

    @Test
    void loginFailsOnWrongPassword() {
        when(repository.findByEmailIgnoreCase("ana@camarmo.com")).thenReturn(Optional.of(user(true)));

        assertThatThrownBy(() -> service.login(new LoginRequest("ana@camarmo.com", "errada", false)))
                .isInstanceOf(InvalidCredentialsException.class);
    }

    @Test
    void loginFailsWithSameErrorForUnknownEmail() {
        assertThatThrownBy(() -> service.login(new LoginRequest("ninguem@camarmo.com", "x", false)))
                .isInstanceOf(InvalidCredentialsException.class)
                .hasMessage("Email ou senha inválidos");
    }

    @Test
    void loginFailsForInactiveUserEvenWithCorrectPassword() {
        when(repository.findByEmailIgnoreCase("ana@camarmo.com")).thenReturn(Optional.of(user(false)));

        assertThatThrownBy(() -> service.login(new LoginRequest("ana@camarmo.com", "senha-forte-1", false)))
                .isInstanceOf(InvalidCredentialsException.class);
    }

    @Test
    void loginIsRateLimitedAfterRepeatedFailures() {
        when(repository.findByEmailIgnoreCase("ana@camarmo.com")).thenReturn(Optional.of(user(true)));
        for (int i = 0; i < AuthService.MAX_FAILED_LOGINS; i++) {
            assertThatThrownBy(() -> service.login(new LoginRequest("ana@camarmo.com", "errada", false)))
                    .isInstanceOf(InvalidCredentialsException.class);
        }

        assertThatThrownBy(() -> service.login(new LoginRequest("ana@camarmo.com", "senha-forte-1", false)))
                .isInstanceOf(TooManyRequestsException.class);
    }

    @Test
    void loginLinksHeadhunterUserWithoutLinkByEmail() {
        AppUser unlinked = user(true).toBuilder().headhunterId(null).build();
        Headhunter hh = new Headhunter("Ana", "ana@camarmo.com", Headhunter.Seniority.PLENO);
        hh.setId(17L);
        when(repository.findByEmailIgnoreCase("ana@camarmo.com")).thenReturn(Optional.of(unlinked));
        when(headhunterRepository.findFirstByEmailIgnoreCase("ana@camarmo.com")).thenReturn(Optional.of(hh));
        when(repository.save(any(AppUser.class))).thenAnswer(inv -> inv.getArgument(0));

        AuthResponse response = service.login(new LoginRequest("ana@camarmo.com", "senha-forte-1", false));

        assertThat(response.user().headhunterId()).isEqualTo(17L);
        verify(repository).save(argThat(u -> Long.valueOf(17L).equals(u.getHeadhunterId())));
    }

    @Test
    void loginKeepsExistingHeadhunterLink() {
        when(repository.findByEmailIgnoreCase("ana@camarmo.com")).thenReturn(Optional.of(user(true)));

        AuthResponse response = service.login(new LoginRequest("ana@camarmo.com", "senha-forte-1", false));

        assertThat(response.user().headhunterId()).isEqualTo(9L);
        verify(repository, never()).save(any());
    }
}
