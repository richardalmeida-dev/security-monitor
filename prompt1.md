Tarefa: deixar o dashboard do security-monitor mais explicativo, intuitivo e melhor visualmente,
mantendo a estética SOC escura e tudo do que já funciona. Continua vanilla (no máximo uma lib leve
via CDN só pro gráfico, se precisar), lê os nomes reais dos campos da API, e no fim roda e confirma
o render. Adiciona:

1. Ícones pra leitura rápida. Coloca ícones (SVG inline, sem lib pesada) nos pontos-chave: um escudo
   ou alerta nos alertas, um cadeado ou pessoa em login, um prédio no FINANCIAL, um globo na geo.
   Ícone mais texto lê muito mais rápido que só texto e dá acabamento.

2. Cada alerta explica o que é e o que fazer. Abaixo da descrição, uma linha em linguagem simples:
   o que significa e a ação sugerida. Ex.: "Várias senhas erradas do mesmo IP em pouco tempo,
   possível ataque de força bruta. Sugestão: revisar ou bloquear o IP e checar a conta." Pode ser
   expansível num "entender" pra não poluir.

3. Gráfico de atividade no tempo. Um gráfico compacto (barras ou linha) de eventos por minuto na
   última janela, com as falhas destacadas. É o que conta a história visualmente, dá pra ver o pico
   do ataque. Faz em SVG na mão, calculando do /api/events. Se quiser algo mais rico, Chart.js via
   CDN é aceitável, mas mantém leve.

4. Uma frase de resumo no topo da atividade. Tipo "Na última hora: 10 falhas de 3 IPs distintos,
   1 alerta novo." Uma linha que diz o que está acontecendo agora, sem a pessoa ler tabela.

5. Seções com título e uma linha de explicação cada: Visão geral, Alertas (o que precisa de
   atenção), Atividade (tudo que entrou), Tendência (gráfico e distribuição). Deixa a tela
   auto-explicativa.

6. Polimento visual. Hierarquia clara (alerta em destaque, atividade secundária), espaçamento mais
   generoso, cantos e bordas consistentes, cor com propósito (vermelho só pra ameaça, verde pra ok,
   neutro pro resto). Mantém o dark SOC, só mais caprichado.

7. Tira os traços do texto da interface. Onde tiver o caractere "—" (no banner de status, por
   exemplo), troca por vírgula ou ponto. Texto da UI só com ponto e vírgula.

Não quebra o que já existe (status banner, legenda, agrupamento, filtros). Roda e confirma o render
contra o simulador no fim.