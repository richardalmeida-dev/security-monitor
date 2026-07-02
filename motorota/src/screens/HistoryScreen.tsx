import React from 'react';
import { Alert, SectionList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Card, EmptyState, ScreenTitle } from '../components';
import { formatBRL, formatClock, formatDayLabel } from '../format';
import { useStore } from '../store';
import { colors } from '../theme';
import { Delivery } from '../types';

type Section = {
  title: string;
  count: number;
  total: number;
  data: Delivery[];
};

export function HistoryScreen() {
  const { deliveries, undoDelivered, removeDelivery } = useStore();

  const delivered = deliveries
    .filter((d) => d.status === 'delivered' && d.deliveredAt)
    .sort((a, b) => (b.deliveredAt ?? '').localeCompare(a.deliveredAt ?? ''));

  const sections: Section[] = [];
  for (const d of delivered) {
    const label = formatDayLabel(d.deliveredAt as string);
    let section = sections.find((s) => s.title === label);
    if (!section) {
      section = { title: label, count: 0, total: 0, data: [] };
      sections.push(section);
    }
    section.data.push(d);
    section.count += 1;
    section.total += d.value;
  }

  const options = (d: Delivery) => {
    Alert.alert(d.customerName, 'O que deseja fazer com esta entrega?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Voltar para pendentes', onPress: () => undoDelivered(d.id) },
      {
        text: 'Excluir do histórico',
        style: 'destructive',
        onPress: () => removeDelivery(d.id),
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <ScreenTitle
        title="Histórico"
        subtitle="Tudo fica salvo no seu celular, mesmo fechando o app"
      />
      <SectionList
        sections={sections}
        keyExtractor={(d) => d.id}
        contentContainerStyle={{ paddingBottom: 30 }}
        ListEmptyComponent={
          <EmptyState
            emoji="✅"
            title="Nenhuma entrega concluída ainda"
            subtitle="Quando você marcar uma entrega como entregue na aba Rota, ela aparece aqui com data, hora e valor."
          />
        }
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionTotal}>
              {section.count} entrega{section.count > 1 ? 's' : ''} · {formatBRL(section.total)}
            </Text>
          </View>
        )}
        renderItem={({ item: d }) => (
          <TouchableOpacity activeOpacity={0.8} onLongPress={() => options(d)}>
            <Card>
              <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.name}>{d.customerName}</Text>
                  {d.item ? <Text style={styles.item}>{d.item}</Text> : null}
                  <Text style={styles.address}>📍 {d.address}</Text>
                </View>
                <View style={styles.right}>
                  <Text style={styles.value}>{formatBRL(d.value)}</Text>
                  <Text style={styles.time}>
                    ✓ {d.deliveredAt ? formatClock(new Date(d.deliveredAt)) : ''}
                  </Text>
                </View>
              </View>
              <Text style={styles.hint}>Segure para reabrir ou excluir</Text>
            </Card>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  sectionTotal: {
    color: colors.green,
    fontSize: 13,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  name: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  item: {
    color: colors.dim,
    fontSize: 13,
    marginTop: 2,
  },
  address: {
    color: colors.dim,
    fontSize: 12,
    marginTop: 4,
  },
  right: {
    alignItems: 'flex-end',
  },
  value: {
    color: colors.green,
    fontSize: 15,
    fontWeight: '800',
  },
  time: {
    color: colors.dim,
    fontSize: 12,
    marginTop: 4,
  },
  hint: {
    color: colors.border,
    fontSize: 11,
    marginTop: 8,
  },
});
