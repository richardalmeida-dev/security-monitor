package com.conex.securitymonitor.alerting;

// Interface extensível para notificação de alertas (log, e-mail, webhook, Slack, etc.).
public interface Notifier {

    void notify(Alert alert);
}
