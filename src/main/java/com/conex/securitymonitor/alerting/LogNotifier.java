package com.conex.securitymonitor.alerting;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class LogNotifier implements Notifier {

    private static final Logger log = LoggerFactory.getLogger(LogNotifier.class);

    @Override
    public void notify(Alert alert) {
        log.warn("ALERT [{}] ip={} user={} country={} city={} occurrences={} message='{}'",
                alert.getAlertType(),
                alert.getIp(),
                alert.getUsername(),
                alert.getCountry(),
                alert.getCity(),
                alert.getOccurrences(),
                alert.getMessage());
    }
}
