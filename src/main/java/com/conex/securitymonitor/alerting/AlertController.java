package com.conex.securitymonitor.alerting;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/alerts")
public class AlertController {

    private final AlertService service;

    public AlertController(AlertService service) {
        this.service = service;
    }

    // TODO(prod): proteger leitura (api-key/JWT). Aberto para o dashboard local funcionar.
    @GetMapping
    public List<Alert> latest(@RequestParam(defaultValue = "50") int limit) {
        return service.latest(limit);
    }
}
