package com.empresa.sistema.config;

import com.empresa.sistema.domain.entity.Client;
import com.empresa.sistema.domain.entity.ClientHistory;
import com.empresa.sistema.domain.entity.JobHistory;
import com.empresa.sistema.domain.repository.ClientHistoryRepository;
import com.empresa.sistema.domain.repository.ClientRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.List;

@Component
@ConditionalOnProperty(name = "app.seed.client-notes", havingValue = "true")
@RequiredArgsConstructor
@Slf4j
public class ClientNotesSeedRunner implements CommandLineRunner {

    private final ClientRepository clientRepository;
    private final ClientHistoryRepository clientHistoryRepository;

    @Override
    @Transactional
    public void run(String... args) {
        List<Client> clients = clientRepository.findAll();
        int counter = 0;

        for (Client client : clients) {
            if (!StringUtils.hasText(client.getNotes())) {
                continue;
            }

            // IDEMPOTENCY GUARD: skip if any history already exists for this client
            if (clientHistoryRepository.existsByClientId(client.getId())) {
                continue;
            }

            LocalDateTime createdAt = client.getUpdatedAt() != null
                    ? client.getUpdatedAt()
                    : LocalDateTime.now();

            ClientHistory entry = ClientHistory.builder()
                    .client(client)
                    .type(JobHistory.HistoryType.NOTE)
                    .title("Nota legada migrada")
                    .description(client.getNotes())
                    .createdAt(createdAt)
                    .build();

            clientHistoryRepository.save(entry);
            counter++;
        }

        log.info("ClientNotes seed: migrated {} client notes", counter);
    }
}
