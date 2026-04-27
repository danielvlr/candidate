package com.empresa.sistema.domain.service;

import com.empresa.sistema.api.dto.request.InviteCandidateRequest;
import com.empresa.sistema.api.dto.request.SelfRegisterRequest;
import com.empresa.sistema.domain.entity.Candidate;
import com.empresa.sistema.domain.entity.Candidate.CandidateStatus;
import com.empresa.sistema.domain.entity.CandidateInvitation;
import com.empresa.sistema.domain.entity.CandidateInvitation.InvitationStatus;
import com.empresa.sistema.domain.entity.CandidateOrigin;
import com.empresa.sistema.domain.entity.Headhunter;
import com.empresa.sistema.domain.repository.CandidateInvitationRepository;
import com.empresa.sistema.domain.repository.CandidateRepository;
import com.empresa.sistema.domain.repository.HeadhunterRepository;
import com.empresa.sistema.domain.service.exception.BusinessException;
import com.empresa.sistema.domain.service.exception.InvalidInvitationException;
import com.empresa.sistema.domain.service.exception.ResourceNotFoundException;
import com.empresa.sistema.domain.service.result.CandidateRegisterResult;
import com.empresa.sistema.domain.service.result.InvitationCreatedResult;
import com.empresa.sistema.domain.service.result.PublicInvitationView;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class CandidateInvitationService {

    private static final int INVITE_TTL_DAYS = 7;

    private final CandidateInvitationRepository invitationRepo;
    private final CandidateRepository candidateRepo;
    private final HeadhunterRepository headhunterRepo;
    private final InvitationTokenService tokenService;

    /**
     * Persists a new invitation row WITHOUT sending the email.
     *
     * @implNote (CRITICAL — do not refactor email send into this method).
     * The caller (CandidateInvitationController.invite or .resend) MUST call
     * {@code mailSender.send()} OUTSIDE this transaction, AFTER the JPA commit.
     * Spring AOP applies @Transactional only on calls that cross the proxy
     * boundary; an internal {@code this.send(...)} call would not start a new
     * TX and could attempt SMTP inside the persist transaction. If SMTP then
     * fails, the invitation row would rollback while the controller still
     * sees a 2xx response — the exact race v2 plan eliminated.
     *
     * Alternative (more robust): register a TransactionSynchronization.afterCommit()
     * callback inside this method that fires the send. Adopt this if more
     * post-commit side effects accumulate (webhooks, analytics, etc.).
     */
    @Transactional
    public InvitationCreatedResult invitePersist(InviteCandidateRequest req, Long headhunterId) {
        Headhunter hh = headhunterRepo.findById(headhunterId)
            .orElseThrow(() -> new ResourceNotFoundException("Headhunter não encontrado: " + headhunterId));

        String email = req.getEmail().trim().toLowerCase();
        Optional<Candidate> existing = candidateRepo.findByEmailIgnoreCase(email);

        Candidate candidate;
        if (existing.isPresent()) {
            Candidate c = existing.get();
            CandidateOrigin origin = c.getOrigin();

            if (origin == CandidateOrigin.JESTOR) {
                throw new BusinessException("Candidato já existe via Jestor. Não é possível convidar.");
            }
            if (origin == CandidateOrigin.MANUAL) {
                throw new BusinessException("Candidato já cadastrado manualmente. Não é possível convidar.");
            }
            // origin == SELF_REGISTERED → reuse if eligible
            if (c.getStatus() != CandidateStatus.INVITED && c.getStatus() != CandidateStatus.PENDING_APPROVAL) {
                throw new BusinessException("Candidato existe mas com status incompatível: " + c.getStatus());
            }
            // revoke ALL non-terminal invitations (PENDING + EMAIL_FAILED) for this candidate
            List<CandidateInvitation> stale = invitationRepo.findByCandidateIdAndStatusIn(
                c.getId(), Arrays.asList(InvitationStatus.PENDING, InvitationStatus.EMAIL_FAILED));
            for (CandidateInvitation inv : stale) {
                inv.setStatus(InvitationStatus.REVOKED);
                inv.setRevokedAt(LocalDateTime.now());
                inv.setRevokedByHeadhunterId(headhunterId);
            }
            invitationRepo.saveAll(stale);
            candidate = c;
        } else {
            // create new candidate as SELF_REGISTERED, status=INVITED
            candidate = new Candidate();
            candidate.setEmail(email);
            candidate.setFullName(StringUtils.hasText(req.getFullName()) ? req.getFullName() : email);
            candidate.setOrigin(CandidateOrigin.SELF_REGISTERED);
            candidate.setStatus(CandidateStatus.INVITED);
            candidate.setInvitedByHeadhunterId(headhunterId);
            candidate = candidateRepo.save(candidate);
        }

        String rawToken = tokenService.generateToken();
        String tokenHash = tokenService.hash(rawToken);

        CandidateInvitation invitation = CandidateInvitation.builder()
            .candidate(candidate)
            .invitedByHeadhunter(hh)
            .tokenHash(tokenHash)
            .status(InvitationStatus.PENDING)
            .expiresAt(LocalDateTime.now().plusDays(INVITE_TTL_DAYS))
            .sendAttempts(0)
            .build();
        invitation = invitationRepo.save(invitation);

        log.info("invitation_persisted invitation_id={} candidate_id={} headhunter_id={} email={}",
                 invitation.getId(), candidate.getId(), headhunterId, tokenService.maskEmail(email));

        String hhName = hh.getFullName() != null ? hh.getFullName() : ("Headhunter #" + hh.getId());

        return InvitationCreatedResult.builder()
            .invitation(invitation)
            .rawToken(rawToken)
            .candidateName(candidate.getFullName())
            .email(email)
            .headhunterName(hhName)
            .build();
    }

    @Transactional(readOnly = true)
    public PublicInvitationView lookupByToken(String rawToken) {
        String tokenHash = tokenService.hash(rawToken);
        CandidateInvitation inv = invitationRepo.findByTokenHash(tokenHash)
            .orElseThrow(() -> new InvalidInvitationException("Convite inválido."));

        if (inv.getStatus() != InvitationStatus.PENDING && inv.getStatus() != InvitationStatus.EMAIL_FAILED) {
            throw new InvalidInvitationException("Convite não está mais ativo.");
        }
        if (tokenService.isExpired(inv.getExpiresAt())) {
            throw new InvalidInvitationException("Convite expirado.");
        }

        Candidate c = inv.getCandidate();
        Headhunter hh = inv.getInvitedByHeadhunter();
        return PublicInvitationView.builder()
            .fullName(c.getFullName())
            .email(c.getEmail())
            .invitedByHeadhunterName(hh.getFullName() != null ? hh.getFullName() : ("Headhunter #" + hh.getId()))
            .expiresAt(inv.getExpiresAt())
            .consentVersion("v1")
            .build();
    }

    @Transactional
    public CandidateRegisterResult register(String rawToken, SelfRegisterRequest req) {
        String tokenHash = tokenService.hash(rawToken);
        CandidateInvitation inv = invitationRepo.findByTokenHash(tokenHash)
            .orElseThrow(() -> new InvalidInvitationException("Convite inválido."));

        if (inv.getStatus() != InvitationStatus.PENDING && inv.getStatus() != InvitationStatus.EMAIL_FAILED) {
            throw new InvalidInvitationException("Convite não está mais ativo.");
        }
        if (tokenService.isExpired(inv.getExpiresAt())) {
            inv.setStatus(InvitationStatus.EXPIRED);
            invitationRepo.save(inv);
            throw new InvalidInvitationException("Convite expirado.");
        }

        // mark consumed atomically
        inv.setStatus(InvitationStatus.CONSUMED);
        inv.setConsumedAt(LocalDateTime.now());
        invitationRepo.save(inv);

        Candidate c = inv.getCandidate();
        c.setFullName(req.getFullName());
        if (StringUtils.hasText(req.getHeadline())) c.setHeadline(req.getHeadline());
        if (StringUtils.hasText(req.getCity())) c.setCity(req.getCity());
        if (StringUtils.hasText(req.getState())) c.setState(req.getState());
        if (StringUtils.hasText(req.getLinkedinUrl())) c.setLinkedinUrl(req.getLinkedinUrl());
        if (StringUtils.hasText(req.getSummary())) c.setSummary(req.getSummary());
        c.setConsentAcceptedAt(LocalDateTime.now());
        c.setConsentVersion(req.getConsentVersion());
        c.setStatus(CandidateStatus.PENDING_APPROVAL);
        candidateRepo.save(c);

        log.info("candidate_self_registered candidate_id={} invitation_id={}", c.getId(), inv.getId());

        return CandidateRegisterResult.builder()
            .candidateId(c.getId())
            .message("Cadastro recebido. Você receberá email após aprovação.")
            .build();
    }

    @Transactional
    public InvitationCreatedResult resend(Long candidateId, Long headhunterId) {
        Candidate c = candidateRepo.findById(candidateId)
            .orElseThrow(() -> new ResourceNotFoundException("Candidato não encontrado: " + candidateId));
        if (c.getOrigin() != CandidateOrigin.SELF_REGISTERED) {
            throw new BusinessException("Só é possível reenviar convite para candidatos com origin=SELF_REGISTERED");
        }
        if (c.getStatus() != CandidateStatus.INVITED && c.getStatus() != CandidateStatus.PENDING_APPROVAL) {
            throw new BusinessException("Status do candidato não permite reenvio: " + c.getStatus());
        }
        // Build a synthetic InviteCandidateRequest and reuse invitePersist logic
        InviteCandidateRequest req = new InviteCandidateRequest();
        req.setEmail(c.getEmail());
        req.setFullName(c.getFullName());
        return invitePersist(req, headhunterId);
    }

    @Transactional
    public void revoke(Long invitationId, Long headhunterId) {
        CandidateInvitation inv = invitationRepo.findById(invitationId)
            .orElseThrow(() -> new ResourceNotFoundException("Convite não encontrado: " + invitationId));
        if (inv.getStatus() == InvitationStatus.CONSUMED || inv.getStatus() == InvitationStatus.REVOKED) {
            throw new BusinessException("Convite já está em estado terminal: " + inv.getStatus());
        }
        inv.setStatus(InvitationStatus.REVOKED);
        inv.setRevokedAt(LocalDateTime.now());
        inv.setRevokedByHeadhunterId(headhunterId);
        invitationRepo.save(inv);
    }

    @Transactional
    public int expirePendingInvitations() {
        LocalDateTime now = LocalDateTime.now();
        List<CandidateInvitation> stale = invitationRepo.findByStatusAndExpiresAtBefore(InvitationStatus.PENDING, now);
        stale.addAll(invitationRepo.findByStatusAndExpiresAtBefore(InvitationStatus.EMAIL_FAILED, now));
        for (CandidateInvitation inv : stale) {
            inv.setStatus(InvitationStatus.EXPIRED);
        }
        invitationRepo.saveAll(stale);
        log.info("invitations_expired count={}", stale.size());
        return stale.size();
    }

    @Transactional
    public void markEmailFailed(Long invitationId) {
        invitationRepo.findById(invitationId).ifPresent(inv -> {
            inv.setStatus(InvitationStatus.EMAIL_FAILED);
            invitationRepo.save(inv);
        });
    }
}
