Tarefa: redesenhar o dashboard estático do security-monitor (src/main/resources/static/:
index.html, style.css, app.js). Manter o contrato da API atual — LEIA os nomes reais dos campos
em /api/stats, /api/events e /api/alerts antes de mexer no app.js, não assuma. Sem build novo,
sem dependência externa (vanilla JS, como já está). No fim, rode e confirme que renderiza com os
dados do simulador; me diga o que mudou.

Estética: SOC / terminal escuro (pode manter o estilo atual, só elevando o acabamento).
- Fundo quase preto, painéis um tom acima, bordas finas (1px sutil).
- Um acento "frio" para vivo/ok (ciano ou verde), vermelho para ameaça/HIGH, âmbar para médio.
- Monospace para dados (IP, timestamp, contadores). Labels podem ser uppercase (faz parte do visual).
- Glow discreto só no indicador "LIVE" e em alertas HIGH. Sem exagero de neon.

Melhorias de clareza e apresentação:
1. Top bar: marca + indicador LIVE pulsando + "última atualização" + um badge honesto de ambiente,
   "DEV · dados simulados", pra deixar claro de onde vêm os dados.
2. Cards de KPI (4): Eventos, Alertas, Falhas de login, Falhas (60 min). Número grande em mono +
   label. O card de Alertas fica vermelho quando > 0; falhas em âmbar. Sub-rótulo de contexto.
3. Alertas em destaque (é o mais importante): cada alerta como linha/card com borda esquerda
   colorida por severidade, pill de severidade (HIGH em vermelho), tipo, IP em mono, badge da fonte,
   tempo relativo ("há 2 min", absoluto no hover), descrição e contador de ocorrências.
   Estado vazio claro: "Nenhum alerta — sistema nominal".
4. Tabela de eventos:
   - FONTE como badge colorido e consistente por sistema: APP, ADMIN_PANEL, FINANCIAL (cores
     distintas, usadas em todo lugar).
   - TIPO como tag colorida: sucesso/access_granted = verde; login_failure/access_denied = vermelho;
     sensitive_action = âmbar; logout = neutro.
   - Tempo relativo como principal, absoluto no title/hover.
   - PAÍS/CIDADE: quando UNKNOWN, mostrar "—" apagado (não poluir); destacar quando vier real.
   - Tingir levemente linhas de falha. IP e horário em mono.
   - Refresh de 5s sem flicker: atualizar sem recriar tudo / preservar scroll.
5. Faixa de distribuição (barras simples em CSS, sem lib), calculada no client a partir dos eventos
   já buscados: "por fonte" e "por tipo". Ajuda a entender o cenário num relance.
6. Opcional: filtro por fonte/tipo e busca por IP/usuário.

Não-objetivos: nada de gráfico pesado/lib externa, nada de mudar a API, nada de tocar no backend
além de eventualmente expor um campo que o dashboard precise (se precisar, me avise antes).
Acessibilidade: contraste suficiente, marcação semântica.