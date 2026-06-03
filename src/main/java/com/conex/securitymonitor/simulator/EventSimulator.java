package com.conex.securitymonitor.simulator;

import com.conex.securitymonitor.config.AppProperties;
import com.conex.securitymonitor.event.EventRequest;
import com.conex.securitymonitor.event.EventService;
import com.conex.securitymonitor.event.EventType;
import com.conex.securitymonitor.event.SourceSystem;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

@Component
public class EventSimulator {

    private static final Logger log = LoggerFactory.getLogger(EventSimulator.class);

    private static final List<String> RANDOM_IPS = List.of(
            "198.51.100.10", "198.51.100.22", "198.51.100.45",
            "192.0.2.7", "192.0.2.88", "203.0.113.5"
    );
    private static final List<String> USERS = List.of(
            "alice", "bob", "carol", "dave", "eve"
    );
    private static final List<EventType> RANDOM_TYPES = List.of(
            EventType.LOGIN_SUCCESS, EventType.LOGOUT, EventType.ACCESS_GRANTED,
            EventType.ACCESS_DENIED, EventType.SENSITIVE_ACTION, EventType.LOGIN_FAILURE
    );

    private final EventService eventService;
    private final AppProperties props;

    public EventSimulator(EventService eventService, AppProperties props) {
        this.eventService = eventService;
        this.props = props;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void onReady() {
        if (!props.getSimulator().isEnabled()) {
            log.info("Simulator desligado.");
            return;
        }
        int burst = props.getSimulator().getBurstSize();
        String ip = props.getSimulator().getBurstIp();
        log.info("Simulator: enviando rajada de {} LOGIN_FAILURE do IP {} para disparar brute-force.", burst, ip);
        for (int i = 0; i < burst; i++) {
            EventRequest r = new EventRequest();
            r.setEventType(EventType.LOGIN_FAILURE);
            r.setSourceSystem(SourceSystem.APP);
            r.setUsername("victim");
            r.setIp(ip);
            r.setUserAgent("simulator/burst");
            r.setDetails("simulated brute-force attempt #" + (i + 1));
            r.setOccurredAt(Instant.now());
            try {
                eventService.ingest(r);
            } catch (Exception ex) {
                log.warn("Simulator burst: falha ingerindo evento ({}).", ex.getMessage());
            }
        }
    }

    // Roda periodicamente quando habilitado (dev). Período configurável (default 10s).
    @Scheduled(fixedDelayString = "#{${security-monitor.simulator.period-seconds:10} * 1000}",
            initialDelayString = "#{${security-monitor.simulator.period-seconds:10} * 1000}")
    public void tick() {
        if (!props.getSimulator().isEnabled()) {
            return;
        }
        ThreadLocalRandom rnd = ThreadLocalRandom.current();
        EventRequest r = new EventRequest();
        r.setEventType(RANDOM_TYPES.get(rnd.nextInt(RANDOM_TYPES.size())));
        r.setSourceSystem(SourceSystem.values()[rnd.nextInt(SourceSystem.values().length)]);
        r.setUsername(USERS.get(rnd.nextInt(USERS.size())));
        r.setIp(RANDOM_IPS.get(rnd.nextInt(RANDOM_IPS.size())));
        r.setUserAgent("simulator/random");
        r.setDetails("randomly generated event");
        r.setOccurredAt(Instant.now());
        try {
            eventService.ingest(r);
        } catch (Exception ex) {
            log.debug("Simulator tick: falha ingerindo ({}).", ex.getMessage());
        }
    }
}
