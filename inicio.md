# Contexto
Você vai construir, do zero, um serviço de monitoramento de segurança chamado `security-monitor`.
Ele recebe eventos de segurança das aplicações (login, acesso, ações sensíveis), enriquece com
geolocalização do IP, detecta atividade suspeita e gera alertas. É o nó central de um monitoramento
maior (um SIEM), mas NESTA entrega construímos só o núcleo standalone, testável com um simulador —
sem integração com sistemas reais.

# Stack (obrigatória)
- Java 21, Maven, Spring Boot 3.3.x
- Spring Web, Spring Data JPA, Spring Security, Validation, Actuator
- PostgreSQL + Flyway (Flyway é a fonte única do schema; spring.jpa.hibernate.ddl-auto=none)
- MaxMind GeoLite2 (geoip2) para GeoIP — opcional em runtime
- springdoc-openapi (Swagger UI)
- JUnit 5 + Mockito
- NÃO usar Lombok (getters/setters/construtores escritos à mão)

# Convenções
- groupId com.conex, artifactId security-monitor, pacote base com.conex.securitymonitor
- Organização package-by-feature (event, detection, alerting, geo, stats, config, simulator)
- Código limpo; comentários só onde agregam

# Escopo funcional (v1 — MVP)
1. Ingestão: POST /api/events, protegido por header X-API-Key (chave em config). Payload validado.
2. Evento persistido com: tipo, sistema de origem, usuário, IP, país, cidade, user-agent, detalhes,
   occurredAt, receivedAt.
   - EventType: LOGIN_SUCCESS, LOGIN_FAILURE, LOGOUT, ACCESS_GRANTED, ACCESS_DENIED, SENSITIVE_ACTION
   - SourceSystem: APP, ADMIN_PANEL, FINANCIAL
3. GeoIP: resolve país/cidade do IP via GeoLite2. Opcional: se o .mmdb não existir, o serviço sobe
   normal e marca UNKNOWN (nunca quebrar por causa do GeoIP).
4. Detecção — brute force: a cada LOGIN_FAILURE, conta falhas do mesmo IP dentro de uma janela; se
   atingir um limite, gera alerta. Limite e janela configuráveis. Deduplicar (não repetir alerta pro
   mesmo IP/tipo dentro da janela).
5. Alertas: persistidos e notificados. Interface Notifier extensível + implementação padrão que
   escreve no log. Endpoint GET /api/alerts.
6. Stats: GET /api/stats com contadores (total de eventos, total de alertas, falhas de login, falhas
   na última hora).
7. Dashboard estático em /: dark, denso, sem dependências externas; fetch de /api/stats, /api/events,
   /api/alerts a cada 5s; mostra stats, alertas e eventos.
8. Simulador (liga/desliga por config, default ligado em dev): no startup injeta uma rajada de falhas
   de um mesmo IP (dispara alerta) e depois gera eventos aleatórios entre as fontes periodicamente.
   Em produção, desligado.
9. Swagger UI acessível.
10. Migrations Flyway criando tabelas e índices.
11. Docker: Dockerfile multi-stage + docker-compose (Postgres + app), subindo com um comando.
12. CI no GitHub Actions: build + testes; job de CodeQL (SAST) para Java.
13. Pelo menos um teste de unidade da regra de brute force (Mockito, sem subir contexto Spring).

# Segurança / acesso
- POST /api/events exige X-API-Key.
- Os GETs de leitura podem ficar abertos para o dashboard local funcionar sem config, MAS deixe
  TODO/comentário claro de que em produção precisam ser protegidos (API key/JWT).

# Fora de escopo nesta v1 (NÃO implemente)
- Integração com sistemas reais mandando eventos de verdade
- OpenSearch/Elasticsearch, Kafka
- Outras regras de detecção além de brute force
- Qualquer ML

# LGPD (registrar no README e em comentário)
IP e login são dados pessoais. Este é o núcleo standalone; integrar com sistemas reais exige
autorização do dono do sistema e base legal de LGPD (finalidade, retenção, proteção dos próprios logs).

# Critérios de aceite (precisa passar de verdade)
- `mvn verify` verde (compila + testes).
- `docker compose up --build` sobe Postgres + app sem erro.
- http://localhost:8080 abre o dashboard e ele popula.
- Com o simulador ligado, um alerta de brute force aparece em /api/alerts e no dashboard em segundos.
- Swagger acessível.

# Como conduzir (importante: vamos por partes)
1. Primeiro me apresente um plano curto: árvore de arquivos proposta + as fases de implementação.
   Espere meu OK antes de codar.
2. Implemente em incrementos pequenos e compiláveis. Rode `mvn compile`/testes ao fim de cada fase e
   me dê um resumo curto do que entregou.
3. No final, rode a stack completa e confirme os critérios de aceite, colando a evidência relevante.
4. Se algo estiver ambíguo, pergunte em vez de adivinhar. Se desviar do escopo por motivo técnico,
   diga explicitamente.