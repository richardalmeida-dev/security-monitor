import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { Button, Field } from '../components';
import { parseBRL, newId } from '../format';
import { autocompleteAddress, geocodeAddress, geocodePlaceId, Suggestion } from '../google';
import { useStore } from '../store';
import { colors } from '../theme';
import { Delivery, LatLng } from '../types';

type Props = {
  visible: boolean;
  onClose: () => void;
  /** entrega existente para edição; undefined = nova */
  editing?: Delivery;
};

export function DeliveryFormModal({ visible, onClose, editing }: Props) {
  const { settings, addDelivery, updateDelivery } = useStore();

  const [customerName, setCustomerName] = useState('');
  const [item, setItem] = useState('');
  const [valueText, setValueText] = useState('');
  const [addressText, setAddressText] = useState('');
  const [pickedLocation, setPickedLocation] = useState<LatLng | undefined>();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [saving, setSaving] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipNextAutocomplete = useRef(false);

  useEffect(() => {
    if (visible) {
      setCustomerName(editing?.customerName ?? '');
      setItem(editing?.item ?? '');
      setValueText(editing ? String(editing.value.toFixed(2)).replace('.', ',') : '');
      setAddressText(editing?.address ?? '');
      setPickedLocation(editing?.location);
      setSuggestions([]);
      skipNextAutocomplete.current = true;
    }
  }, [visible, editing]);

  useEffect(() => {
    if (!visible) return;
    if (skipNextAutocomplete.current) {
      skipNextAutocomplete.current = false;
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!settings.apiKey || addressText.trim().length < 4) {
      setSuggestions([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      const results = await autocompleteAddress(addressText.trim(), settings.apiKey);
      setSuggestions(results);
    }, 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [addressText, visible, settings.apiKey]);

  const pickSuggestion = async (s: Suggestion) => {
    skipNextAutocomplete.current = true;
    setAddressText(s.description);
    setSuggestions([]);
    try {
      const result = await geocodePlaceId(s.placeId, settings.apiKey);
      setPickedLocation(result.location);
    } catch {
      // resolve depois, ao salvar
      setPickedLocation(undefined);
    }
  };

  const save = async () => {
    const name = customerName.trim();
    const address = addressText.trim();
    if (!name) {
      Alert.alert('Falta o nome', 'Informe o nome do cliente.');
      return;
    }
    if (!address) {
      Alert.alert('Falta o endereço', 'Informe o endereço da entrega.');
      return;
    }
    const value = valueText.trim() ? parseBRL(valueText) : 0;
    if (value == null) {
      Alert.alert('Valor inválido', 'Use o formato 12,50.');
      return;
    }

    setSaving(true);
    try {
      let location = pickedLocation;
      let finalAddress = address;
      if (!location) {
        if (!settings.apiKey) {
          throw new Error(
            'Configure a chave de API do Google em Ajustes para o app localizar os endereços.'
          );
        }
        const geo = await geocodeAddress(address, settings.apiKey);
        location = geo.location;
        finalAddress = geo.formatted;
      }

      if (editing) {
        updateDelivery(editing.id, {
          customerName: name,
          item: item.trim(),
          value,
          address: finalAddress,
          location,
        });
      } else {
        addDelivery({
          id: newId(),
          customerName: name,
          item: item.trim(),
          value,
          address: finalAddress,
          location,
          status: 'pending',
          createdAt: new Date().toISOString(),
        });
      }
      onClose();
    } catch (e) {
      Alert.alert('Não foi possível salvar', e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} transparent>
      <View style={styles.backdrop}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.sheetWrap}
        >
          <View style={styles.sheet}>
            <View style={styles.header}>
              <Text style={styles.title}>{editing ? 'Editar entrega' : 'Nova entrega'}</Text>
              <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Text style={styles.close}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView keyboardShouldPersistTaps="handled">
              <Field
                label="Nome do cliente"
                value={customerName}
                onChangeText={setCustomerName}
                placeholder="Ex.: Maria Silva"
                autoCapitalize="words"
              />
              <Field
                label="Entrega (o que é)"
                value={item}
                onChangeText={setItem}
                placeholder="Ex.: Pizza grande calabresa"
              />
              <Field
                label="Valor (R$)"
                value={valueText}
                onChangeText={setValueText}
                placeholder="Ex.: 45,90"
                keyboardType="decimal-pad"
              />
              <Field
                label="Endereço"
                value={addressText}
                onChangeText={(t) => {
                  setAddressText(t);
                  setPickedLocation(undefined);
                }}
                placeholder="Rua, número, bairro, cidade"
                autoCapitalize="sentences"
              />
              {suggestions.length > 0 && (
                <View style={styles.suggestions}>
                  {suggestions.slice(0, 5).map((s) => (
                    <TouchableOpacity
                      key={s.placeId}
                      style={styles.suggestion}
                      onPress={() => pickSuggestion(s)}
                    >
                      <Text style={styles.suggestionText}>📍 {s.description}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              {pickedLocation && (
                <Text style={styles.locatedHint}>✓ Endereço localizado no mapa</Text>
              )}

              <Button
                title={editing ? 'Salvar alterações' : 'Adicionar entrega'}
                onPress={save}
                loading={saving}
                style={{ marginTop: 6, marginBottom: 24 }}
              />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheetWrap: {
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 18,
    paddingTop: 18,
    maxHeight: '92%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
  },
  close: {
    color: colors.dim,
    fontSize: 22,
    fontWeight: '700',
  },
  suggestions: {
    backgroundColor: colors.cardAlt,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: -8,
    marginBottom: 14,
    overflow: 'hidden',
  },
  suggestion: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  suggestionText: {
    color: colors.text,
    fontSize: 14,
  },
  locatedHint: {
    color: colors.green,
    fontSize: 13,
    marginTop: -6,
    marginBottom: 12,
  },
});
