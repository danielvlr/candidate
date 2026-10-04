package com.empresa.sistema.config;

import com.empresa.sistema.security.JwtAuthFilter;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

import static org.springframework.security.web.util.matcher.AntPathRequestMatcher.antMatcher;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;
    private final ObjectMapper objectMapper;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
                .csrf(AbstractHttpConfigurer::disable) // API stateless via header Bearer, sem cookie de sessão
                .cors(Customizer.withDefaults())       // reaproveita os mappings de WebConfig
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .httpBasic(AbstractHttpConfigurer::disable)
                .formLogin(AbstractHttpConfigurer::disable)
                .logout(AbstractHttpConfigurer::disable)
                .headers(h -> h.frameOptions(f -> f.sameOrigin())) // H2 console (somente local)
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(antMatcher(HttpMethod.OPTIONS, "/**")).permitAll()
                        .requestMatchers(
                                antMatcher(HttpMethod.POST, "/api/v1/auth/login"),
                                antMatcher(HttpMethod.POST, "/api/v1/auth/forgot-password"),
                                antMatcher(HttpMethod.POST, "/api/v1/auth/reset-password"),
                                antMatcher(HttpMethod.GET, "/api/v1/auth/reset-password/validate"),
                                antMatcher("/api/v1/public/**"),
                                antMatcher(HttpMethod.GET, "/api/"),
                                antMatcher(HttpMethod.GET, "/api/health"),
                                antMatcher(HttpMethod.GET, "/uploads/**"),
                                antMatcher("/h2-console/**"),
                                antMatcher("/error")
                        ).permitAll()
                        .requestMatchers(antMatcher("/api/v1/users/**")).hasRole("ADMIN")
                        .anyRequest().authenticated())
                .exceptionHandling(e -> e
                        .authenticationEntryPoint((req, res, ex) ->
                                writeError(res, HttpServletResponse.SC_UNAUTHORIZED, "Não autenticado",
                                        "Faça login para acessar este recurso"))
                        .accessDeniedHandler((req, res, ex) ->
                                writeError(res, HttpServletResponse.SC_FORBIDDEN, "Acesso negado",
                                        "Você não tem permissão para acessar este recurso")))
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
                .build();
    }

    /** Evita que o Spring Boot registre o filtro JWT uma segunda vez fora da cadeia de segurança. */
    @Bean
    public FilterRegistrationBean<JwtAuthFilter> jwtAuthFilterRegistration(JwtAuthFilter filter) {
        FilterRegistrationBean<JwtAuthFilter> registration = new FilterRegistrationBean<>(filter);
        registration.setEnabled(false);
        return registration;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    private void writeError(HttpServletResponse res, int status, String error, String message) throws IOException {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("status", status);
        body.put("error", error);
        body.put("message", message);
        body.put("timestamp", LocalDateTime.now().toString());
        res.setStatus(status);
        res.setContentType(MediaType.APPLICATION_JSON_VALUE);
        res.setCharacterEncoding("UTF-8");
        objectMapper.writeValue(res.getOutputStream(), body);
    }
}
