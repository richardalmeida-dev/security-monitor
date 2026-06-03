package com.conex.securitymonitor.geo;

// Stub: por padrão devolve UNKNOWN. A implementação concreta com GeoLite2
// é registrada na Fase 4 (substitui este bean via @Primary ou via @ConditionalOnMissingBean).
public interface GeoIpService {

    GeoLocation resolve(String ip);
}
