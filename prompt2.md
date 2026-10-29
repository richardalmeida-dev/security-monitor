Tarefa: adicionar painéis com mais dados ao dashboard do security-monitor, mantendo a estética SOC,
os ícones e as cores já definidos, e sem quebrar o que existe (status banner, KPIs, legenda,
agrupamento, filtros, gráfico de atividade, seções). Vanilla, sem lib pesada. No fim, roda e confirma
o render contra o simulador.

Fonte dos dados: por padrão, calcula os painéis no client a partir de um fetch maior de /api/events
(sobe o fetch usado nas agregações pra ~300, dentro do limite de 500; a tabela visível continua
mostrando os recentes, sem despejar 300 linhas). Os KPIs continuam vindo do /api/stats. Os painéis
representam a atividade recente, que é o que importa num painel ao vivo.

Painéis novos:

1. Por sistema. Uma faixa de cards, um por fonte (APP, ADMIN_PANEL, FINANCIAL), cada um com: total de
   eventos, falhas de login e alertas daquela fonte (cruza alertas por sourceSystem). Usa o ícone e a
   cor da fonte. Marca em vermelho a fonte com mais falhas ou alertas. Responde num relance "qual
   sistema está mais sob ataque".

2. Top IPs ofensores. Lista compacta dos IPs com mais falhas de login na janela atual, mostrando a
   contagem, a fonte e um marcador vermelho se o IP já gerou alerta. É o "quem está batendo mais".

3. Resumo de alertas. Uma strip curta com a contagem por tipo e severidade, ex.: "7 Brute force,
   todos HIGH". Fica perto da seção de alertas.

4. Taxa de login. Um indicador simples de sucesso contra falha de login na janela (proporção, ou
   "X ok, Y falhas"), pra dar noção de quão ruim está a tentativa de acesso.

Onde encaixar: "Por sistema", "Resumo de alertas" e "Taxa de login" na Visão geral, logo abaixo dos
KPIs; "Top IPs" na Atividade ou na Tendência. Reaproveita as seções e a hierarquia que já existem.

Texto da UI sem traços, só ponto e vírgula. Mantém tudo client-side por padrão. Se você achar que vale
refletir todos os dados e não só os recentes, pode adicionar endpoints de agregação no backend
(by-source, top-ips), mas confirma comigo antes de mexer no backend.