package com.conex.securitymonitor.alerting;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Service
public class AlertService {

    private final AlertRepository repository;
    private final List<Notifier> notifiers;

    public AlertService(AlertRepository repository, List<Notifier> notifiers) {
        this.repository = repository;
        this.notifiers = notifiers;
    }

    @Transactional(readOnly = true)
    public Optional<Alert> findActiveAlert(AlertType type, String ip, Instant now) {
        return repository.findActiveAlert(type, ip, now);
    }

    @Transactional
    public Alert raise(Alert alert) {
        Alert saved = repository.save(alert);
        notifiers.forEach(n -> n.notify(saved));
        return saved;
    }

    @Transactional(readOnly = true)
    public List<Alert> latest(int limit) {
        int capped = Math.max(1, Math.min(limit, 500));
        return repository.findAllByOrderByCreatedAtDesc(PageRequest.of(0, capped));
    }

    @Transactional(readOnly = true)
    public long count() {
        return repository.count();
    }
}
