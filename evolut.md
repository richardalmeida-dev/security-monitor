Tarefa: evoluir o dashboard do security-monitor pra ficar mais intuitivo, mantendo a estética SOC
escura. Continua valendo tudo do brief anterior (badges por fonte, cores por tipo, tema escuro, ler
os nomes reais dos campos da API antes de mexer no app.js, vanilla JS, sem build). No fim, roda e
confirma que renderiza com o simulador. Adiciona estas melhorias de clareza:

1. Cabeçalho que se explica: título "Monitoramento de segurança" e uma linha curta dizendo o que é
   ("eventos das aplicações em tempo real, com detecção de atividade suspeita"), mais o badge
   "DEV, dados simulados" que já existe.

2. Indicador de status geral bem visível: quando há alerta ativo, um aviso vermelho tipo "X alertas
   ativos"; quando não há, um verde "tudo nominal". A pessoa entende a situação num relance, antes
   de ler a tabela.

3. Legenda de cores: um bloco pequeno explicando o que cada cor significa, por tipo de evento (verde
   sucesso, vermelho falha ou negado, âmbar ação sensível) e por fonte (APP, ADMIN_PANEL,
   FINANCIAL). A cor deixa de ser adivinhação.

4. Rótulos em linguagem humana: em vez de LOGIN_FAILURE cru, mostra "Falha de login", "Login ok",
   "Ação sensível". Pode manter o código técnico pequeno do lado ou num tooltip.

5. Agrupar eventos repetidos: hoje uma rajada de brute force vira 7 linhas iguais e polui. Colapsa
   eventos idênticos seguidos (mesmo IP, mesmo tipo, mesma fonte) numa linha só, tipo "7x Falha de
   login, 203.0.113.42, ADMIN_PANEL", expansível se a pessoa quiser ver cada um.

6. Filtros simples no topo da lista: por fonte e por tipo, mais busca por IP ou usuário. Resolve
   perguntas tipo "só as falhas no financeiro".

7. Tempo amigável: "há 2 min" como principal e o horário exato no hover. Mais fácil de ler que
   timestamp cru.

8. Geolocalização só quando faz sentido: quando país/cidade for UNKNOWN, mostra apagado ou "n/d";
   destaca quando vier real.

9. Estados vazios com texto útil: "Nenhum alerta. Sistema nominal." e "Sem eventos ainda."

10. Tooltip curto em cada card de número explicando o que ele conta.

Mantém acessibilidade e contraste. Nada de lib externa pesada, segue vanilla.