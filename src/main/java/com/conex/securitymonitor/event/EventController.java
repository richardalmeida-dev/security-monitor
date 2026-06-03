package com.conex.securitymonitor.event;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.List;

@RestController
@RequestMapping("/api/events")
public class EventController {

    private final EventService service;

    public EventController(EventService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<EventResponse> create(@Valid @RequestBody EventRequest body) {
        Event saved = service.ingest(body);
        return ResponseEntity
                .created(UriComponentsBuilder.fromPath("/api/events/{id}").buildAndExpand(saved.getId()).toUri())
                .body(EventResponse.from(saved));
    }

    // TODO(prod): proteger leitura (api-key/JWT). Aberto para o dashboard local funcionar.
    @GetMapping
    public List<EventResponse> latest(@RequestParam(defaultValue = "50") int limit) {
        return service.latest(limit).stream().map(EventResponse::from).toList();
    }
}
