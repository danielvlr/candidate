package com.empresa.sistema.security;

import com.empresa.sistema.domain.entity.AppUser;
import com.empresa.sistema.domain.repository.AppUserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Lê "Authorization: Bearer &lt;jwt&gt;", valida e autentica a request.
 * O usuário é recarregado do banco a cada request para que desativação/troca de role
 * tenha efeito imediato (sem esperar o token expirar).
 */
@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    public static final String PASSWORD_CHANGE_REQUIRED = "PASSWORD_CHANGE_REQUIRED";
    private static final String BEARER_PREFIX = "Bearer ";
    private static final String AUTH_PATH_PREFIX = "/api/v1/auth/";

    private final JwtService jwtService;
    private final AppUserRepository userRepository;
    private final ObjectMapper objectMapper;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String header = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (header != null && header.startsWith(BEARER_PREFIX)
                && SecurityContextHolder.getContext().getAuthentication() == null) {
            String token = header.substring(BEARER_PREFIX.length()).trim();
            jwtService.parseUserId(token)
                    .flatMap(userRepository::findById)
                    .filter(AppUser::isActive)
                    .ifPresent(user -> authenticate(user, request));
        }
        if (mustBlock(request)) {
            writePasswordChangeRequired(response);
            return;
        }
        chain.doFilter(request, response);
    }

    /**
     * Com {@code mustChangePassword} ligado só o namespace de auth (me, change-password, login...) fica liberado.
     * A flag vem do usuário recarregado do banco, então vale na hora, sem depender do token.
     */
    private boolean mustBlock(HttpServletRequest request) {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof AuthenticatedUser principal)) {
            return false;
        }
        return principal.mustChangePassword()
                && !HttpMethod.OPTIONS.matches(request.getMethod())
                && !request.getRequestURI().startsWith(AUTH_PATH_PREFIX);
    }

    private void writePasswordChangeRequired(HttpServletResponse response) throws IOException {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("status", HttpServletResponse.SC_FORBIDDEN);
        body.put("error", "Acesso negado");
        body.put("code", PASSWORD_CHANGE_REQUIRED);
        body.put("message", "É necessário definir uma nova senha antes de continuar");
        body.put("timestamp", LocalDateTime.now().toString());
        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        objectMapper.writeValue(response.getOutputStream(), body);
    }

    private void authenticate(AppUser user, HttpServletRequest request) {
        var authorities = List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()));
        var authentication = new UsernamePasswordAuthenticationToken(AuthenticatedUser.from(user), null, authorities);
        authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
        SecurityContextHolder.getContext().setAuthentication(authentication);
    }
}
