import React, { useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Button, Card, EmptyState, ScreenTitle } from '../components';
import { formatBRL } from '../format';
import { useStore } from '../store';
import { colors } from '../theme';
import { Delivery } from '../types';
import { DeliveryFormModal } from './DeliveryFormModal';

export function DeliveriesScreen() {
  const { deliveries, removeDelivery } = useStore();
  const [formVisible, setFormVisible] = useState(false);
  const [editing, setEditing] = useState<Delivery | undefined>();

  const pending = deliveries.filter((d) => d.status === 'pending');
  const totalValue = pending.reduce((sum, d) => sum + d.value, 0);

  const confirmRemove = (delivery: Delivery) => {
    Alert.alert('Excluir entrega', `Excluir a entrega de ${delivery.customerName}?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: () => removeDelivery(delivery.id) },
    ]);
  };

  return (
    <View style={styles.container}>
      <ScreenTitle
        title="Entregas de hoje"
        subtitle={
          pending.length
            ? `${pending.length} pendente${pending.length > 1 ? 's' : ''} · ${formatBRL(totalValue)}`
            : 'Nenhuma entrega pendente'
        }
      />

      <FlatList
        data={pending}
        keyExtractor={(d) => d.id}
        contentContainerStyle={{ paddingBottom: 90 }}
        ListEmptyComponent={
          <EmptyState
            emoji="📦"
            title="Sem entregas por enquanto"
            subtitle="Toque em “Nova entrega” e cadastre nome, pedido, valor e endereço. Depois vá na aba Rota para gerar o caminho mais rápido."
          />
        }
        renderItem={({ item: d }) => (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              setEditing(d);
              setFormVisible(true);
            }}
            onLongPress={() => confirmRemove(d)}
          >
            <Card>
              <View style={styles.cardHeader}>
                <Text style={styles.name}>{d.customerName}</Text>
                <Text style={styles.value}>{formatBRL(d.value)}</Text>
              </View>
              {d.item ? <Text style={styles.item}>{d.item}</Text> : null}
              <Text style={styles.address}>📍 {d.address}</Text>
              {!d.location && (
                <Text style={styles.warning}>⚠️ Endereço ainda não localizado no mapa</Text>
              )}
              <View style={styles.cardActions}>
                <TouchableOpacity onPress={() => confirmRemove(d)}>
                  <Text style={styles.deleteText}>Excluir</Text>
                </TouchableOpacity>
                <Text style={styles.editHint}>Toque para editar</Text>
              </View>
            </Card>
          </TouchableOpacity>
        )}
      />

      <View style={styles.fabWrap}>
        <Button
          title="➕  Nova entrega"
          onPress={() => {
            setEditing(undefined);
            setFormVisible(true);
          }}
        />
      </View>

      <DeliveryFormModal
        visible={formVisible}
        editing={editing}
        onClose={() => setFormVisible(false)}
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
  },
  value: {
    color: colors.green,
    fontSize: 16,
    fontWeight: '800',
  },
  item: {
    color: colors.text,
    fontSize: 14,
    marginBottom: 4,
  },
  address: {
    color: colors.dim,
    fontSize: 13,
    lineHeight: 18,
  },
  warning: {
    color: colors.yellow,
    fontSize: 12,
    marginTop: 6,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  deleteText: {
    color: colors.red,
    fontSize: 13,
    fontWeight: '600',
  },
  editHint: {
    color: colors.dim,
    fontSize: 12,
  },
  fabWrap: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 14,
  },
});
