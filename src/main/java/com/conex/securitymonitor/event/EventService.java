package com.conex.securitymonitor.event;

import com.conex.securitymonitor.detection.BruteForceDetector;
import com.conex.securitymonitor.geo.GeoIpService;
import com.conex.securitymonitor.geo.GeoLocation;
import org.springframework.context.annotation.Lazy;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
public class EventService {

    private final EventRepository repository;
    private final GeoIpService geoIpService;
    private final BruteForceDetector bruteForceDetector;

    public EventService(EventRepository repository,
                        GeoIpService geoIpService,
                        @Lazy BruteForceDetector bruteForceDetector) {
        this.repository = repository;
        this.geoIpService = geoIpService;
        this.bruteForceDetector = bruteForceDetector;
    }

    @Transactional
    public Event ingest(EventRequest req) {
        Event e = new Event();
        e.setEventType(req.getEventType());
        e.setSourceSystem(req.getSourceSystem());
        e.setUsername(req.getUsername());
        e.setIp(req.getIp());
        e.setUserAgent(req.getUserAgent());
        e.setDetails(req.getDetails());
        e.setOccurredAt(req.getOccurredAt() != null ? req.getOccurredAt() : Instant.now());
        e.setReceivedAt(Instant.now());

        GeoLocation loc = geoIpService.resolve(req.getIp());
        e.setCountry(loc.getCountry());
        e.setCity(loc.getCity());

        Event saved = repository.save(e);
        bruteForceDetector.evaluate(saved);
        return saved;
    }

    @Transactional(readOnly = true)
    public List<Event> latest(int limit) {
        int capped = Math.max(1, Math.min(limit, 500));
        return repository.findAllByOrderByOccurredAtDesc(PageRequest.of(0, capped));
    }
}
