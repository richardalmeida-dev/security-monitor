package com.conex.securitymonitor.config;

import org.springframework.beans.factory.InitializingBean;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

import java.util.Arrays;

// Fail-closed em produção: se o perfil 'prod' estiver ativo e a API key
// não estiver setada via env var (SECURITY_MONITOR_API_KEY), o app NÃO sobe.
@Component
public class ApiKeyStartupCheck implements InitializingBean {

    private final AppProperties props;
    private final Environment env;

    public ApiKeyStartupCheck(AppProperties props, Environment env) {
        this.props = props;
        this.env = env;
    }

    @Override
    public void afterPropertiesSet() {
        boolean prod = Arrays.asList(env.getActiveProfiles()).contains("prod");
        String key = props.getApiKey();
        boolean missing = key == null || key.isBlank();

        if (prod && missing) {
            throw new IllegalStateException(
                    "SECURITY_MONITOR_API_KEY ausente no perfil prod. "
                            + "Set via env var antes de subir o app (fail-closed).");
        }
        if (!prod && missing) {
            throw new IllegalStateException(
                    "security-monitor.api-key não configurada. "
                            + "Em dev é injetada por application-dev.yml; verifique o perfil ativo.");
        }
    }
}
