package com.conex.securitymonitor.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "security-monitor")
public class AppProperties {

    private String apiKey;
    private Detection detection = new Detection();
    private Geo geo = new Geo();
    private Simulator simulator = new Simulator();

    public String getApiKey() {
        return apiKey;
    }

    public void setApiKey(String apiKey) {
        this.apiKey = apiKey;
    }

    public Detection getDetection() {
        return detection;
    }

    public void setDetection(Detection detection) {
        this.detection = detection;
    }

    public Geo getGeo() {
        return geo;
    }

    public void setGeo(Geo geo) {
        this.geo = geo;
    }

    public Simulator getSimulator() {
        return simulator;
    }

    public void setSimulator(Simulator simulator) {
        this.simulator = simulator;
    }

    public static class Detection {
        private BruteForce bruteForce = new BruteForce();

        public BruteForce getBruteForce() {
            return bruteForce;
        }

        public void setBruteForce(BruteForce bruteForce) {
            this.bruteForce = bruteForce;
        }
    }

    public static class BruteForce {
        private int windowMinutes = 5;
        private int threshold = 5;

        public int getWindowMinutes() {
            return windowMinutes;
        }

        public void setWindowMinutes(int windowMinutes) {
            this.windowMinutes = windowMinutes;
        }

        public int getThreshold() {
            return threshold;
        }

        public void setThreshold(int threshold) {
            this.threshold = threshold;
        }
    }

    public static class Geo {
        private String databasePath;

        public String getDatabasePath() {
            return databasePath;
        }

        public void setDatabasePath(String databasePath) {
            this.databasePath = databasePath;
        }
    }

    public static class Simulator {
        private boolean enabled;
        private int burstSize = 7;
        private String burstIp = "203.0.113.42";
        private int periodSeconds = 10;

        public boolean isEnabled() {
            return enabled;
        }

        public void setEnabled(boolean enabled) {
            this.enabled = enabled;
        }

        public int getBurstSize() {
            return burstSize;
        }

        public void setBurstSize(int burstSize) {
            this.burstSize = burstSize;
        }

        public String getBurstIp() {
            return burstIp;
        }

        public void setBurstIp(String burstIp) {
            this.burstIp = burstIp;
        }

        public int getPeriodSeconds() {
            return periodSeconds;
        }

        public void setPeriodSeconds(int periodSeconds) {
            this.periodSeconds = periodSeconds;
        }
    }
}
