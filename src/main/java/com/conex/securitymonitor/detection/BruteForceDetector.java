package com.conex.securitymonitor.detection;

import com.conex.securitymonitor.alerting.Alert;
import com.conex.securitymonitor.alerting.AlertService;
import com.conex.securitymonitor.alerting.AlertType;
import com.conex.securitymonitor.config.AppProperties;
import com.conex.securitymonitor.event.Event;
import com.conex.securitymonitor.event.EventRepository;
import com.conex.securitymonitor.event.EventType;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.Optional;

@Component
public class BruteForceDetector {

    private static final Logger log = LoggerFactory.getLogger(BruteForceDetector.class);

    private final EventRepository eventRepository;
    private final AlertService alertService;
    private final int windowMinutes;
    private final int threshold;

    @Autowired
    public BruteForceDetector(EventRepository eventRepository,
                              AlertService alertService,
                              AppProperties props) {
        this(eventRepository, alertService,
                props.getDetection().getBruteForce().getWindowMinutes(),
                props.getDetection().getBruteForce().getThreshold());
    }

    // Construtor "puro" usado nos testes (sem AppProperties).
    BruteForceDetector(EventRepository eventRepository,
                       AlertService alertService,
                       int windowMinutes,
                       int threshold) {
        this.eventRepository = eventRepository;
        this.alertService = alertService;
        this.windowMinutes = windowMinutes;
        this.threshold = threshold;
    }

    public Optional<Alert> evaluate(Event event) {
        if (event.getEventType() != EventType.LOGIN_FAILURE) {
            return Optional.empty();
        }

        Instant now = Instant.now();
        Instant since = now.minus(Duration.ofMinutes(windowMinutes));

        long failures = eventRepository.countByTypeAndIpSince(EventType.LOGIN_FAILURE, event.getIp(), since);
        if (failures < threshold) {
            return Optional.empty();
        }

        // Dedup: se já existe alerta ativo (windowEnd no futuro) para o mesmo (tipo, ip), não cria outro.
        Optional<Alert> active = alertService.findActiveAlert(AlertType.BRUTE_FORCE_LOGIN, event.getIp(), now);
        if (active.isPresent()) {
            log.debug("Brute force: alerta ativo já existe para ip={}, ignorando.", event.getIp());
            return Optional.empty();
        }

        Alert alert = new Alert();
        alert.setAlertType(AlertType.BRUTE_FORCE_LOGIN);
        alert.setIp(event.getIp());
        alert.setUsername(event.getUsername());
        alert.setCountry(event.getCountry());
        alert.setCity(event.getCity());
        alert.setOccurrences((int) failures);
        alert.setCreatedAt(now);
        alert.setWindowStart(since);
        alert.setWindowEnd(now.plus(Duration.ofMinutes(windowMinutes)));
        alert.setMessage("Brute force: " + failures + " falhas de login do IP "
                + event.getIp() + " nos últimos " + windowMinutes + " min");

        return Optional.of(alertService.raise(alert));
    }
}
