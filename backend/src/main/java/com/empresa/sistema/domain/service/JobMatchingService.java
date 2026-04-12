package com.empresa.sistema.domain.service;

import com.empresa.sistema.api.dto.response.JobMatchResponse;
import com.empresa.sistema.api.dto.response.JobResponse;
import com.empresa.sistema.api.mapper.JobMapper;
import com.empresa.sistema.domain.entity.Assessorado;
import com.empresa.sistema.domain.entity.Candidate;
import com.empresa.sistema.domain.entity.Job;
import com.empresa.sistema.domain.repository.AssessoradoRepository;
import com.empresa.sistema.domain.repository.JobRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class JobMatchingService {

    private final JobRepository jobRepository;
    private final AssessoradoRepository assessoradoRepository;
    private final JobMapper jobMapper;

    public List<JobMatchResponse> findMatchingJobs(Long assessoradoId) {
        Assessorado assessorado = assessoradoRepository.findById(assessoradoId)
                .orElseThrow(() -> new IllegalArgumentException("Assessorado não encontrado"));

        Candidate candidate = assessorado.getCandidate();
        List<Job> activeJobs = jobRepository.findByStatus(Job.JobStatus.ACTIVE);

        List<JobMatchResponse> matches = new ArrayList<>();

        for (Job job : activeJobs) {
            int score = 0;
            List<String> matchingSkills = new ArrayList<>();
            List<String> matchReasons = new ArrayList<>();

            // Skills match: up to 35 points
            if (candidate.getSkills() != null && job.getSkillsRequired() != null) {
                List<String> candidateSkillList = parseSkills(candidate.getSkills());
                List<String> jobSkillList = parseSkills(job.getSkillsRequired());

                for (String jobSkill : jobSkillList) {
                    for (String candidateSkill : candidateSkillList) {
                        if (candidateSkill.equalsIgnoreCase(jobSkill)) {
                            matchingSkills.add(jobSkill);
                            break;
                        }
                    }
                }

                if (!jobSkillList.isEmpty()) {
                    int skillScore = (int) ((double) matchingSkills.size() / jobSkillList.size() * 35);
                    score += skillScore;
                    if (!matchingSkills.isEmpty()) {
                        matchReasons.add("Skills compatíveis: " + String.join(", ", matchingSkills));
                    }
                }
            }

            // Work mode match: +20 points
            if (candidate.getWorkPreference() != null && job.getWorkMode() != null) {
                boolean workModeMatch = candidate.getWorkPreference().name().equals(job.getWorkMode().name());
                if (workModeMatch) {
                    score += 20;
                    matchReasons.add("Modo de trabalho compatível: " + job.getWorkMode().name());
                }
            }

            // Salary match: +20 points
            if (candidate.getDesiredSalary() != null && job.getSalaryMin() != null && job.getSalaryMax() != null) {
                if (candidate.getDesiredSalary() >= job.getSalaryMin() &&
                        candidate.getDesiredSalary() <= job.getSalaryMax()) {
                    score += 20;
                    matchReasons.add("Faixa salarial compatível");
                }
            }

            // Location match: +10 points
            if (candidate.getCity() != null && job.getLocation() != null) {
                if (job.getLocation().toLowerCase().contains(candidate.getCity().toLowerCase())) {
                    score += 10;
                    matchReasons.add("Localização compatível: " + job.getLocation());
                }
            }

            // Experience level match: +15 points
            if (job.getExperienceLevel() != null) {
                int expScore = calculateExperienceLevelScore(candidate, job.getExperienceLevel());
                if (expScore > 0) {
                    score += expScore;
                    matchReasons.add("Nível de experiência compatível: " + job.getExperienceLevel().name());
                }
            }

            if (score > 20) {
                JobResponse jobResponse = jobMapper.toResponse(job);
                matches.add(JobMatchResponse.builder()
                        .job(jobResponse)
                        .matchScore(Math.min(score, 100))
                        .matchingSkills(matchingSkills)
                        .matchReasons(matchReasons)
                        .build());
            }
        }

        return matches.stream()
                .sorted((a, b) -> Integer.compare(b.getMatchScore(), a.getMatchScore()))
                .limit(20)
                .collect(Collectors.toList());
    }

    private List<String> parseSkills(String skills) {
        if (skills == null || skills.isBlank()) {
            return new ArrayList<>();
        }
        return Arrays.stream(skills.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toList());
    }

    private int calculateExperienceLevelScore(Candidate candidate, Job.ExperienceLevel experienceLevel) {
        if (candidate.getHeadline() == null) return 0;
        String headline = candidate.getHeadline().toLowerCase();

        return switch (experienceLevel) {
            case ENTRY, JUNIOR -> (headline.contains("junior") || headline.contains("júnior") ||
                    headline.contains("estagi") || headline.contains("trainee")) ? 15 : 0;
            case MID -> (headline.contains("pleno") || headline.contains("analista") ||
                    headline.contains("mid") || headline.contains("desenvolvedor")) ? 15 : 0;
            case SENIOR, LEAD -> (headline.contains("senior") || headline.contains("sênior") ||
                    headline.contains("lead") || headline.contains("líder") ||
                    headline.contains("gerente") || headline.contains("coordenador")) ? 15 : 0;
            case PRINCIPAL -> (headline.contains("diretor") || headline.contains("head") ||
                    headline.contains("principal") || headline.contains("vp") ||
                    headline.contains("c-level")) ? 15 : 0;
        };
    }
}
