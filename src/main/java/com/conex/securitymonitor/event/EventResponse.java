package com.conex.securitymonitor.event;

import java.time.Instant;

public class EventResponse {

    private Long id;
    private EventType eventType;
    private SourceSystem sourceSystem;
    private String username;
    private String ip;
    private String country;
    private String city;
    private String userAgent;
    private String details;
    private Instant occurredAt;
    private Instant receivedAt;

    public static EventResponse from(Event e) {
        EventResponse r = new EventResponse();
        r.id = e.getId();
        r.eventType = e.getEventType();
        r.sourceSystem = e.getSourceSystem();
        r.username = e.getUsername();
        r.ip = e.getIp();
        r.country = e.getCountry();
        r.city = e.getCity();
        r.userAgent = e.getUserAgent();
        r.details = e.getDetails();
        r.occurredAt = e.getOccurredAt();
        r.receivedAt = e.getReceivedAt();
        return r;
    }

    public Long getId() {
        return id;
    }

    public EventType getEventType() {
        return eventType;
    }

    public SourceSystem getSourceSystem() {
        return sourceSystem;
    }

    public String getUsername() {
        return username;
    }

    public String getIp() {
        return ip;
    }

    public String getCountry() {
        return country;
    }

    public String getCity() {
        return city;
    }

    public String getUserAgent() {
        return userAgent;
    }

    public String getDetails() {
        return details;
    }

    public Instant getOccurredAt() {
        return occurredAt;
    }

    public Instant getReceivedAt() {
        return receivedAt;
    }
}
