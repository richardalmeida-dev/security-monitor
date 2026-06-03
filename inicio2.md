Plano aprovado. Pode começar pela Fase 1. Respostas aos 4 pontos + 2 ajustes:

1. API key: OK. security.api-key=dev-local-key só no application-dev.yml, sem default no
   application.yml. No perfil prod, exija a chave via variável de ambiente e FALHE NO STARTUP se
   ela não estiver setada (fail closed — não suba com chave vazia/ausente).
2. Brute force: OK — janela 5 min, limite 5, dedup por (IP, tipo, janela).
3. Postgres dev: OK — postgres:16-alpine, db securitymonitor, user/senha app/app no compose.
4. Portas: OK — app 8080, Postgres 5432. Pode deixar o 5432 mapeado no compose; se eu não for usar
   cliente externo, deixe a linha comentada.

Ajustes adicionais:
- Perfil padrão = dev (simulador ON), pra `docker compose up` e execução local funcionarem out of
  the box. prod é opt-in via SPRING_PROFILES_ACTIVE=prod (simulador OFF; leituras GET ficam como
  TODO de proteção).
- Mantenha ddl-auto=none; Flyway é a fonte única do schema.

Segue o fluxo combinado: plano curto por fase, compila/testa ao fim de cada uma e, no final, cola a
evidência dos critérios de aceite.