package com.conex.securitymonitor.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.Components;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI openApi() {
        SecurityScheme apiKeyScheme = new SecurityScheme()
                .type(SecurityScheme.Type.APIKEY)
                .in(SecurityScheme.In.HEADER)
                .name("X-API-Key");

        return new OpenAPI()
                .info(new Info()
                        .title("security-monitor")
                        .description("Security event monitoring service — SIEM core (standalone v1).")
                        .version("1.0.0")
                        .license(new License().name("Internal").url("https://conex.local")))
                .components(new Components().addSecuritySchemes("apiKey", apiKeyScheme))
                .addSecurityItem(new SecurityRequirement().addList("apiKey"));
    }
}
