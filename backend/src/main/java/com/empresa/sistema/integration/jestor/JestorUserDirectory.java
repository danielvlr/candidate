package com.empresa.sistema.integration.jestor;

import java.text.Normalizer;
import java.util.*;

/**
 * Diretório imutável de usuários Jestor (nome -> e-mail).
 *
 * A tabela de headhunters do Jestor não possui campo de e-mail; os e-mails reais só
 * aparecem nos objetos de usuário embutidos nos registros (criado_por, atualizado_por, ...).
 * Este diretório coleta esses usuários e permite resolver o e-mail pelo nome do headhunter.
 */
public final class JestorUserDirectory {

    private static final String PLACEHOLDER_DOMAIN = "@jestor-sync.local";

    private final Map<String, String> emailByKey;

    private JestorUserDirectory(Map<String, String> emailByKey) {
        this.emailByKey = Map.copyOf(emailByKey);
    }

    public static JestorUserDirectory empty() {
        return new JestorUserDirectory(Map.of());
    }

    public static JestorUserDirectory from(Collection<? extends Map<String, Object>> records) {
        Map<String, Set<String>> candidates = new HashMap<>();
        for (Map<String, Object> record : records) {
            collectUsers(record, candidates);
        }
        Map<String, String> unambiguous = new HashMap<>();
        candidates.forEach((key, emails) -> {
            if (emails.size() == 1) unambiguous.put(key, emails.iterator().next());
        });
        return new JestorUserDirectory(unambiguous);
    }

    public Optional<String> findEmailByName(String fullName) {
        if (fullName == null || fullName.isBlank()) return Optional.empty();
        String key = normalize(fullName);
        String email = emailByKey.get(key);
        if (email == null) email = emailByKey.get(key.replace(" ", ""));
        return Optional.ofNullable(email);
    }

    public int size() {
        return new HashSet<>(emailByKey.values()).size();
    }

    public static boolean isPlaceholderEmail(String email) {
        return email == null || email.isBlank() || email.toLowerCase(Locale.ROOT).endsWith(PLACEHOLDER_DOMAIN);
    }

    public static String placeholderEmail(String jestorId) {
        return jestorId + PLACEHOLDER_DOMAIN;
    }

    @SuppressWarnings("unchecked")
    private static void collectUsers(Object node, Map<String, Set<String>> acc) {
        if (node instanceof Map<?, ?> map) {
            if (map.containsKey("id_user") && map.containsKey("email")) {
                addUser((Map<String, Object>) map, acc);
                return;
            }
            map.values().forEach(v -> collectUsers(v, acc));
        } else if (node instanceof Collection<?> list) {
            list.forEach(v -> collectUsers(v, acc));
        }
    }

    private static void addUser(Map<String, Object> user, Map<String, Set<String>> acc) {
        if (!"standard".equals(String.valueOf(user.get("type")))) return;
        String email = asText(user.get("email"));
        if (email == null || !email.contains("@")) return;
        String normalizedEmail = email.toLowerCase(Locale.ROOT);

        for (String name : nameVariants(user, normalizedEmail)) {
            String key = normalize(name);
            if (key.isEmpty()) continue;
            acc.computeIfAbsent(key, k -> new HashSet<>()).add(normalizedEmail);
            acc.computeIfAbsent(key.replace(" ", ""), k -> new HashSet<>()).add(normalizedEmail);
        }
    }

    private static List<String> nameVariants(Map<String, Object> user, String email) {
        List<String> names = new ArrayList<>();
        for (String field : List.of("name", "display_name")) {
            String value = asText(user.get(field));
            if (value != null && !value.contains("@")) names.add(value);
        }
        String first = asText(user.get("first_name"));
        String last = asText(user.get("last_name"));
        if (first != null && !first.contains("@")) {
            names.add(last == null ? first : first + " " + last);
        }
        // Usuário sem nome cadastrado (ex.: name = e-mail): deriva do local-part "nome.sobrenome"
        String localPart = email.substring(0, email.indexOf('@'));
        names.add(localPart.replaceAll("[._\\-]+", " "));
        return names;
    }

    private static String asText(Object value) {
        if (value == null) return null;
        String text = String.valueOf(value).trim();
        return text.isEmpty() || text.equals("null") ? null : text;
    }

    static String normalize(String value) {
        String noAccents = Normalizer.normalize(value, Normalizer.Form.NFD).replaceAll("\\p{M}+", "");
        return noAccents.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9 ]", " ").trim().replaceAll("\\s+", " ");
    }
}
