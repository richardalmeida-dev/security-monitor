import * as Location from 'expo-location';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button, Card, EmptyState, ScreenTitle } from '../components';
import { formatBRL, formatClock, formatDistance, formatDuration } from '../format';
import { computeOptimizedRoute } from '../google';
import { openInGoogleMaps, openInWaze } from '../navigationApps';
import { useStore } from '../store';
import { colors } from '../theme';
import { Delivery, LatLng, OptimizedRoute } from '../types';

async function getCurrentLocation(): Promise<LatLng> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    throw new Error(
      'Permissão de localização negada. Libere a localização nas configurações do celular para o app saber seu ponto de partida.'
    );
  }
  const pos = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });
  return { lat: pos.coords.latitude, lng: pos.coords.longitude };
}

export function RouteScreen() {
  const { deliveries, settings, route, setRoute, markDelivered } = useStore();
  const [generating, setGenerating] = useState(false);

  const pending = deliveries.filter((d) => d.status === 'pending');
  const routable = pending.filter((d) => d.location);
  const unroutable = pending.filter((d) => !d.location);

  const generate = async () => {
    if (!settings.apiKey) {
      Alert.alert(
        'Falta a chave de API',
        'Vá em Ajustes e cole sua chave de API do Google Maps para gerar rotas com trânsito em tempo real.'
      );
      return;
    }
    if (routable.length === 0) {
      Alert.alert('Sem entregas', 'Cadastre pelo menos uma entrega com endereço localizado.');
      return;
    }

    setGenerating(true);
    try {
      const origin = await getCurrentLocation();
      const destination = settings.returnToStart
        ? { text: 'Ponto de partida', location: origin }
        : settings.endAddress;
      if (!destination) {
        throw new Error(
          'Defina o ponto de término em Ajustes (ou marque "voltar ao ponto de partida").'
        );
      }

      const computed = await computeOptimizedRoute(
        origin,
        destination.location,
        routable.map((d) => d.location as LatLng),
        settings.travelMode,
        settings.apiKey
      );

      const orderedIds = computed.order.map((i) => routable[i].id);
      const stops = orderedIds.map((deliveryId, i) => ({
        deliveryId,
        legDurationSec: computed.legs[i]?.durationSec ?? 0,
        legDistanceMeters: computed.legs[i]?.distanceMeters ?? 0,
      }));
      const lastLeg = computed.legs[computed.legs.length - 1];

      const optimized: OptimizedRoute = {
        generatedAt: new Date().toISOString(),
        origin: { text: 'Minha localização', location: origin },
        destination,
        stops,
        finalLeg: {
          durationSec: lastLeg?.durationSec ?? 0,
          distanceMeters: lastLeg?.distanceMeters ?? 0,
        },
        totalDurationSec: computed.totalDurationSec,
        totalDistanceMeters: computed.totalDistanceMeters,
        travelMode: computed.travelMode,
      };
      setRoute(optimized);

      if (unroutable.length > 0) {
        Alert.alert(
          'Atenção',
          `${unroutable.length} entrega(s) ficaram fora da rota porque o endereço não foi localizado. Toque nelas na aba Entregas para corrigir.`
        );
      }
    } catch (e) {
      Alert.alert('Não foi possível gerar a rota', e instanceof Error ? e.message : String(e));
    } finally {
      setGenerating(false);
    }
  };

  const deliveryById = (id: string): Delivery | undefined => deliveries.find((d) => d.id === id);

  const renderRoute = (r: OptimizedRoute) => {
    const generatedAt = new Date(r.generatedAt);
    let cumulativeSec = 0;
    const remaining = r.stops.filter((s) => deliveryById(s.deliveryId)?.status === 'pending');

    return (
      <View>
        <Card style={{ borderColor: colors.accent }}>
          <Text style={styles.summaryTitle}>Resumo da rota</Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{formatDuration(r.totalDurationSec)}</Text>
              <Text style={styles.summaryLabel}>com trânsito</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{formatDistance(r.totalDistanceMeters)}</Text>
              <Text style={styles.summaryLabel}>distância</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>
                {formatClock(new Date(generatedAt.getTime() + r.totalDurationSec * 1000))}
              </Text>
              <Text style={styles.summaryLabel}>volta prevista</Text>
            </View>
          </View>
          <Text style={styles.summaryMeta}>
            {r.travelMode === 'TWO_WHEELER' ? '🏍 Rota de moto' : '🚗 Rota de carro'} · gerada às{' '}
            {formatClock(generatedAt)} ·{' '}
            {r.destination.text === 'Ponto de partida'
              ? 'termina no ponto de partida'
              : `termina em: ${r.destination.text}`}
          </Text>
        </Card>

        {r.stops.map((stop, index) => {
          const d = deliveryById(stop.deliveryId);
          cumulativeSec += stop.legDurationSec;
          const eta = new Date(generatedAt.getTime() + cumulativeSec * 1000);
          if (!d) return null;
          const delivered = d.status === 'delivered';
          return (
            <Card key={stop.deliveryId} style={delivered ? styles.deliveredCard : undefined}>
              <View style={styles.stopHeader}>
                <View style={[styles.stopBadge, delivered && { backgroundColor: colors.green }]}>
                  <Text style={styles.stopBadgeText}>{delivered ? '✓' : index + 1}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.stopName, delivered && styles.strike]}>
                    {d.customerName}
                  </Text>
                  {d.item ? (
                    <Text style={[styles.stopItem, delivered && styles.strike]}>{d.item}</Text>
                  ) : null}
                </View>
                <Text style={styles.stopValue}>{formatBRL(d.value)}</Text>
              </View>
              <Text style={styles.stopAddress}>📍 {d.address}</Text>
              {!delivered && (
                <Text style={styles.stopEta}>
                  🕐 Chegada ~{formatClock(eta)} · {formatDuration(stop.legDurationSec)} ·{' '}
                  {formatDistance(stop.legDistanceMeters)}
                </Text>
              )}
              {!delivered && d.location && (
                <View style={styles.stopActions}>
                  <Button
                    small
                    title="Google Maps"
                    onPress={() => openInGoogleMaps(d.location as LatLng)}
                    style={{ flex: 1, marginRight: 6 }}
                  />
                  <Button
                    small
                    title="Waze"
                    variant="ghost"
                    onPress={() => openInWaze(d.location as LatLng)}
                    style={{ flex: 1, marginRight: 6 }}
                  />
                  <Button
                    small
                    title="✓ Entregue"
                    variant="success"
                    onPress={() => markDelivered(d.id)}
                    style={{ flex: 1 }}
                  />
                </View>
              )}
            </Card>
          );
        })}

        <Card>
          <Text style={styles.finishText}>
            🏁 Término: {r.destination.text} · {formatDuration(r.finalLeg.durationSec)} depois da
            última parada
          </Text>
        </Card>

        {remaining.length > 0 && remaining.length < r.stops.length && (
          <Button
            title="🔄 Recalcular com as entregas restantes"
            variant="ghost"
            onPress={generate}
            loading={generating}
            style={{ marginTop: 4 }}
          />
        )}
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 30 }}>
      <ScreenTitle
        title="Rota otimizada"
        subtitle="Começa onde você está agora e considera o trânsito em tempo real"
      />

      <Button
        title={route ? '🔄  Gerar nova rota' : '🚀  Gerar rota otimizada'}
        onPress={generate}
        loading={generating}
        disabled={routable.length === 0}
        style={{ marginBottom: 14 }}
      />

      {unroutable.length > 0 && (
        <Text style={styles.warning}>
          ⚠️ {unroutable.length} entrega(s) sem endereço localizado — não vão entrar na rota.
        </Text>
      )}

      {route ? (
        renderRoute(route)
      ) : (
        <EmptyState
          emoji="🗺️"
          title={routable.length === 0 ? 'Cadastre entregas primeiro' : 'Pronto para gerar a rota'}
          subtitle={
            routable.length === 0
              ? 'Adicione as entregas na aba Entregas. Depois volte aqui para gerar o caminho mais rápido.'
              : `O app vai ordenar suas ${routable.length} entrega(s) na sequência mais rápida, começando da sua localização atual.`
          }
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  warning: {
    color: colors.yellow,
    fontSize: 13,
    marginBottom: 10,
  },
  summaryTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryValue: {
    color: colors.accent,
    fontSize: 18,
    fontWeight: '800',
  },
  summaryLabel: {
    color: colors.dim,
    fontSize: 12,
    marginTop: 2,
  },
  summaryMeta: {
    color: colors.dim,
    fontSize: 12,
    lineHeight: 17,
  },
  stopHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  stopBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  stopBadgeText: {
    color: colors.white,
    fontWeight: '800',
    fontSize: 14,
  },
  stopName: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  stopItem: {
    color: colors.dim,
    fontSize: 13,
  },
  stopValue: {
    color: colors.green,
    fontSize: 15,
    fontWeight: '800',
    marginLeft: 8,
  },
  stopAddress: {
    color: colors.dim,
    fontSize: 13,
    lineHeight: 18,
  },
  stopEta: {
    color: colors.text,
    fontSize: 13,
    marginTop: 6,
    fontWeight: '600',
  },
  stopActions: {
    flexDirection: 'row',
    marginTop: 12,
  },
  deliveredCard: {
    opacity: 0.55,
  },
  strike: {
    textDecorationLine: 'line-through',
  },
  finishText: {
    color: colors.dim,
    fontSize: 13,
    lineHeight: 18,
  },
});
