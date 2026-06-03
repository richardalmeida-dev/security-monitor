package com.conex.securitymonitor.stats;

import com.conex.securitymonitor.alerting.AlertService;
import com.conex.securitymonitor.event.EventRepository;
import com.conex.securitymonitor.event.EventType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;

@Service
public class StatsService {

    private final EventRepository eventRepository;
    private final AlertService alertService;

    public StatsService(EventRepository eventRepository, AlertService alertService) {
        this.eventRepository = eventRepository;
        this.alertService = alertService;
    }

    @Transactional(readOnly = true)
    public StatsResponse snapshot() {
        long totalEvents = eventRepository.count();
        long totalAlerts = alertService.count();
        long loginFailures = eventRepository.countByEventType(EventType.LOGIN_FAILURE);
        long loginFailuresLastHour = eventRepository.countByTypeSince(
                EventType.LOGIN_FAILURE, Instant.now().minus(Duration.ofHours(1)));
        return new StatsResponse(totalEvents, totalAlerts, loginFailures, loginFailuresLastHour);
    }
}
