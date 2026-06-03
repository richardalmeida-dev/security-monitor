package com.conex.securitymonitor.stats;

public class StatsResponse {

    private final long totalEvents;
    private final long totalAlerts;
    private final long loginFailures;
    private final long loginFailuresLastHour;

    public StatsResponse(long totalEvents, long totalAlerts, long loginFailures, long loginFailuresLastHour) {
        this.totalEvents = totalEvents;
        this.totalAlerts = totalAlerts;
        this.loginFailures = loginFailures;
        this.loginFailuresLastHour = loginFailuresLastHour;
    }

    public long getTotalEvents() {
        return totalEvents;
    }

    public long getTotalAlerts() {
        return totalAlerts;
    }

    public long getLoginFailures() {
        return loginFailures;
    }

    public long getLoginFailuresLastHour() {
        return loginFailuresLastHour;
    }
}
