package com.conex.securitymonitor.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
public class SecurityConfig {

    private final AppProperties props;

    public SecurityConfig(AppProperties props) {
        this.props = props;
    }

    // TODO(prod): leituras GET (/api/events, /api/alerts, /api/stats) e dashboard estão
    // abertas para o dashboard local funcionar sem config. Em produção, proteger com
    // API key (mesmo filter) ou JWT, e restringir CORS / origens.
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        ApiKeyFilter apiKeyFilter = new ApiKeyFilter(props.getApiKey());

        http
                .csrf(csrf -> csrf.disable())
                .cors(cors -> cors.disable())
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                // O ApiKeyFilter já bloqueia POST /api/events sem chave válida.
                // Aqui só liberamos o pipeline do Spring Security — a autorização efetiva
                // do POST está no filter, e o resto é deliberadamente aberto (ver TODO de prod).
                .authorizeHttpRequests(auth -> auth.anyRequest().permitAll())
                .addFilterBefore(apiKeyFilter, UsernamePasswordAuthenticationFilter.class)
                .httpBasic(b -> b.disable())
                .formLogin(f -> f.disable());

        return http.build();
    }
}
