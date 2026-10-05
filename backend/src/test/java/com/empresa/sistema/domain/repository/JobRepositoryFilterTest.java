package com.empresa.sistema.domain.repository;

import com.empresa.sistema.domain.entity.Client;
import com.empresa.sistema.domain.entity.Headhunter;
import com.empresa.sistema.domain.entity.Job;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest(properties = "spring.sql.init.mode=never")
class JobRepositoryFilterTest {

    @Autowired
    private TestEntityManager em;

    @Autowired
    private JobRepository jobRepository;

    private Headhunter devid;

    @BeforeEach
    void setUp() {
        Client client = em.persist(Client.builder().companyName("ACME").build());
        devid = persistHeadhunter("Devid Oliveira", "devid@camarmo.com");
        Headhunter other = persistHeadhunter("Outra Pessoa", "outra@camarmo.com");

        persistJob("Vaga Devid 1", client, devid);
        persistJob("Vaga Devid 2", client, devid);
        persistJob("Vaga Outra", client, other);
        persistJob("Vaga Sem Headhunter", client, null);
        em.flush();
    }

    private Headhunter persistHeadhunter(String name, String email) {
        Headhunter hh = new Headhunter(name, email, Headhunter.Seniority.PLENO);
        hh.setFixedCost(BigDecimal.ZERO);
        hh.setVariableCost(BigDecimal.ZERO);
        return em.persist(hh);
    }

    private void persistJob(String title, Client client, Headhunter hh) {
        Job job = new Job(title, "descricao", client);
        job.setHeadhunter(hh);
        em.persist(job);
    }

    private List<String> titles(Long headhunterId) {
        return jobRepository.findWithFilters(null, null, null, null, null, null, null, null,
                        headhunterId, null, PageRequest.of(0, 2, Sort.by("title")))
                .map(Job::getTitle).getContent();
    }

    @Test
    void filtersByHeadhunterInTheDatabaseNotOnlyWithinTheFirstPage() {
        assertThat(titles(devid.getId())).containsExactly("Vaga Devid 1", "Vaga Devid 2");
        assertThat(jobRepository.findWithFilters(null, null, null, null, null, null, null, null,
                devid.getId(), null, PageRequest.of(0, 2)).getTotalElements()).isEqualTo(2);
    }

    @Test
    void withoutHeadhunterFilterKeepsJobsWithoutHeadhunter() {
        assertThat(jobRepository.findWithFilters(null, null, null, null, null, null, null, null,
                null, null, PageRequest.of(0, 10)).getTotalElements()).isEqualTo(4);
    }
}
