# security-monitor

Núcleo standalone de um SIEM. Recebe eventos de segurança das aplicações
(login, acesso, ações sensíveis), enriquece com geolocalização do IP,
detecta atividade suspeita (brute force em v1) e gera alertas.

**Esta v1 é só o núcleo, testável com um simulador — sem integração com
sistemas reais.**

---

## Stack

- Java 21, Maven, Spring Boot 3.3
- Spring Web, Data JPA, Security, Validation, Actuator
- PostgreSQL + Flyway (`spring.jpa.hibernate.ddl-auto=none` — Flyway é a fonte única do schema)
- MaxMind GeoLite2 (geoip2) — **opcional** em runtime
- springdoc-openapi (Swagger UI)
- JUnit 5 + Mockito
- Sem Lombok

---

## Rodar

### Docker (recomendado)

```bash
docker compose up --build
```

Sobe Postgres (`postgres:16-alpine`) + app na porta `8080`. Perfil `dev`,
simulador ligado. O dashboard popula em alguns segundos.

- Dashboard: <http://localhost:8080/>
- Swagger UI: <http://localhost:8080/swagger-ui.html>
- Health: <http://localhost:8080/actuator/health>

### Local (sem Docker)

Precisa de Postgres rodando em `localhost:5432` com banco `securitymonitor`
e usuário/senha `app/app`. Depois:

```bash
./mvnw spring-boot:run
```

---

## Perfis

| Perfil | Quando | Simulador | API key |
|--------|--------|-----------|---------|
| `dev` (default) | local / docker | **ON** | `dev-local-key` (em `application-dev.yml`) |
| `prod` (opt-in via `SPRING_PROFILES_ACTIVE=prod`) | produção | **OFF** | **obrigatória** via env `SECURITY_MONITOR_API_KEY` — sem ela, o app **não sobe** (fail-closed) |

---

## Endpoints

### POST /api/events  *(autenticado — X-API-Key)*

```bash
curl -X POST http://localhost:8080/api/events \
  -H 'Content-Type: application/json' \
  -H 'X-API-Key: dev-local-key' \
  -d '{
    "eventType": "LOGIN_FAILURE",
    "sourceSystem": "APP",
    "username": "alice",
    "ip": "203.0.113.42",
    "userAgent": "curl/8.0",
    "details": "wrong password",
    "occurredAt": "2026-06-03T12:34:56Z"
  }'
```

`eventType` ∈ `LOGIN_SUCCESS, LOGIN_FAILURE, LOGOUT, ACCESS_GRANTED, ACCESS_DENIED, SENSITIVE_ACTION`
`sourceSystem` ∈ `APP, ADMIN_PANEL, FINANCIAL`

### GET /api/events?limit=N
### GET /api/alerts?limit=N
### GET /api/stats

> Em produção, as leituras GET precisam ser protegidas (API key / JWT).
> Estão abertas aqui só para o dashboard local funcionar sem config — há `TODO(prod)` no código.

---

## Detecção: brute force

- A cada `LOGIN_FAILURE`, conta falhas do mesmo IP dentro de uma janela.
- Limite e janela em `application.yml`:

  ```yaml
  security-monitor.detection.brute-force:
    window-minutes: 5
    threshold: 5
  ```
- Dedup: se já existe alerta ativo (`window_end >= now`) para o mesmo `(tipo, ip)`, **não** cria outro.

---

## GeoIP (opcional)

- Configure `GEOIP_DB_PATH` apontando para um arquivo `GeoLite2-City.mmdb` (não versionado).
- Sem o arquivo, o serviço sobe normal e marca `country=UNKNOWN`, `city=UNKNOWN`. **Nunca quebra por causa do GeoIP.**

---

## Simulador (dev only)

- No startup envia uma rajada de `LOGIN_FAILURE` do IP `203.0.113.42` (default 7) — dispara o alerta de brute force.
- Depois injeta eventos aleatórios a cada `period-seconds` (default 10s) misturando fontes/tipos.
- **Desligado** em `prod`.

---

## Testes

```bash
./mvnw verify
```

O alvo `verify` roda os testes unitários, incluindo `BruteForceDetectorTest`
(JUnit 5 + Mockito puro, sem contexto Spring).

> Mockito usa o **subclass mock-maker** (em `src/test/resources/mockito-extensions/`)
> por causa de limitações do inline mock-maker em JDKs recentes.

---

## CI

- `.github/workflows/ci.yml`: build + testes.
- `.github/workflows/codeql.yml`: SAST com CodeQL (Java).

---

## LGPD

**Endereço IP e nome de usuário (login) são dados pessoais.** Esta v1 é o
núcleo standalone e roda só com simulador. Para integrar com sistemas
reais é necessário:

- Autorização explícita do dono do sistema de origem;
- Base legal definida (finalidade legítima, ex.: segurança da informação);
- Política de retenção dos eventos/alertas e dos próprios logs do serviço;
- Proteção dos logs (acesso restrito, criptografia em trânsito/repouso, controle de quem lê);
- Limitação de acesso aos endpoints GET (que hoje estão abertos por conveniência do dashboard).

Os comentários `TODO(prod)` no código indicam os pontos que precisam ser
endurecidos antes de qualquer integração real.

---

## Estrutura

```
src/main/java/com/conex/securitymonitor/
├── SecurityMonitorApplication.java
├── config/      (AppProperties, SecurityConfig, ApiKeyFilter, ApiKeyStartupCheck, OpenApiConfig)
├── event/       (Event, EventType, SourceSystem, repository, service, controller, DTOs)
├── geo/         (GeoLocation, GeoIpService, MaxMindGeoIpService)
├── detection/   (BruteForceDetector)
├── alerting/    (Alert, AlertType, Notifier, LogNotifier, repository, service, controller)
├── stats/       (StatsService, StatsController, StatsResponse)
└── simulator/   (EventSimulator)
```
