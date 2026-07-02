# 🏍 MotoRota — Rotas otimizadas para entregadores

Aplicativo mobile (Android e iPhone) para entregadores de moto que saem com vários
pedidos e precisam do **caminho mais rápido**, considerando o **trânsito em tempo real**.

## O que o app faz

- **Cadastro rápido de entregas**: nome do cliente, o que é a entrega, valor (R$) e endereço
  (com sugestões automáticas de endereço enquanto digita).
- **Rota otimizada com trânsito ao vivo**: o app pega sua localização atual como **ponto de
  partida**, calcula a **melhor ordem de visita** de todas as entregas usando o Google Maps
  (Routes API, com trânsito em tempo real) e mostra o horário previsto de chegada em cada parada.
- **Ponto de término**: a rota termina de volta no ponto de partida (ex.: voltar à pizzaria)
  ou em um endereço fixo que você configurar — o app entende isso e otimiza levando o retorno em conta.
- **Modo moto** 🏍: usa rotas específicas para duas rodas onde o Google oferece (com
  fallback automático para rota de carro).
- **Navegação com um toque**: cada parada tem botão para abrir o **Google Maps** ou o **Waze**
  já navegando até o endereço.
- **Sem banco de dados / sem servidor**: tudo (entregas, histórico, ajustes) fica salvo
  **somente no celular do entregador**, e não se perde ao fechar o app.
- **Histórico completo**: entregas concluídas ficam registradas por dia, com hora, valor e
  total faturado por dia.

## Como rodar no celular (para testar)

1. Instale o [Node.js](https://nodejs.org) (versão 18 ou mais nova) no computador.
2. No terminal, dentro da pasta `motorota/`:

   ```bash
   npm install
   npx expo start
   ```

3. Instale o app **Expo Go** no celular (Play Store / App Store).
4. Escaneie o QR code que aparece no terminal com o Expo Go (Android) ou com a câmera (iPhone).
   O app abre na hora, no seu celular.

## Chave de API do Google Maps (obrigatória para as rotas)

O trânsito em tempo real e a leitura de endereços usam o Google Maps. Você precisa de uma
chave de API (o Google dá uma cota gratuita mensal, mas pede cartão cadastrado):

1. Acesse <https://console.cloud.google.com> e crie um projeto (ex.: "MotoRota").
2. Ative o faturamento (Billing) do projeto.
3. Em **APIs e serviços → Biblioteca**, habilite estas 3 APIs:
   - **Routes API** (cálculo de rota otimizada com trânsito)
   - **Geocoding API** (transformar endereço em ponto no mapa)
   - **Places API (New)** (sugestões de endereço enquanto digita — opcional, mas recomendada)
4. Em **APIs e serviços → Credenciais**, crie uma **Chave de API** e copie.
5. No app, vá na aba **Ajustes**, cole a chave e toque em **Salvar chave**.

> 💡 A chave fica salva apenas no celular. Recomendado: no Google Cloud, restrinja a chave
> para aceitar somente essas 3 APIs.

## Como usar no dia a dia

1. **Entregas** → `➕ Nova entrega`: preencha nome, pedido, valor e endereço de cada pedido
   que sair com você.
2. **Ajustes** (uma vez só): cole a chave de API, escolha 🏍 Moto e defina o ponto de término
   (voltar ao ponto de partida ou endereço fixo).
3. **Rota** → `🚀 Gerar rota otimizada`: o app usa sua localização atual como partida, ordena
   as paradas na sequência mais rápida com o trânsito de agora e mostra o horário previsto de
   cada entrega e da sua volta.
4. Em cada parada: **Google Maps** ou **Waze** para navegar, e **✓ Entregue** ao concluir.
5. Entregou algumas e o trânsito mudou? Toque em **🔄 Recalcular com as entregas restantes**.
6. **Histórico**: veja tudo que foi entregue, por dia, com o total em R$.

## Publicar na Play Store / App Store (quando quiser)

O projeto usa [Expo](https://expo.dev), então gerar o instalável é simples:

```bash
npm install -g eas-cli
eas login          # crie uma conta gratuita em expo.dev
eas build -p android --profile preview   # gera um APK para instalar direto no celular
eas build -p android                     # gera o AAB para a Play Store
```

Para a Play Store é necessária uma conta de desenvolvedor Google (taxa única de US$ 25).

## Tecnologia

- **React Native + Expo SDK 53** (TypeScript)
- **AsyncStorage** — armazenamento local no aparelho (sem servidor, sem banco de dados externo)
- **Google Routes API v2** — otimização da ordem das paradas (`optimizeWaypointOrder`) com
  preferência `TRAFFIC_AWARE` (trânsito em tempo real) e modo `TWO_WHEELER` (moto)
- **Google Geocoding API + Places Autocomplete (New)** — entendimento de endereços brasileiros
- **expo-location** — ponto de partida pela localização atual (GPS)
- Deep links para navegação no **Google Maps** e **Waze**
