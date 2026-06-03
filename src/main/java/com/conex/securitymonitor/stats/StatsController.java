package com.conex.securitymonitor.stats;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/stats")
public class StatsController {

    private final StatsService service;

    public StatsController(StatsService service) {
        this.service = service;
    }

    // TODO(prod): proteger leitura (api-key/JWT). Aberto para o dashboard local funcionar.
    @GetMapping
    public StatsResponse get() {
        return service.snapshot();
    }
}
