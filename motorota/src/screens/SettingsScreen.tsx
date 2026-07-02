import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { Button, Card, Field, ScreenTitle } from '../components';
import { geocodeAddress } from '../google';
import { useStore } from '../store';
import { colors } from '../theme';
import { TravelMode } from '../types';

export function SettingsScreen() {
  const { settings, updateSettings } = useStore();
  const [apiKeyText, setApiKeyText] = useState(settings.apiKey);
  const [endAddressText, setEndAddressText] = useState(settings.endAddress?.text ?? '');
  const [savingEnd, setSavingEnd] = useState(false);

  const saveApiKey = () => {
    updateSettings({ apiKey: apiKeyText.trim() });
    Alert.alert('Pronto', 'Chave de API salva no celular.');
  };

  const setMode = (travelMode: TravelMode) => updateSettings({ travelMode });

  const saveEndAddress = async () => {
    const text = endAddressText.trim();
    if (!text) {
      updateSettings({ endAddress: undefined, returnToStart: true });
      return;
    }
    if (!settings.apiKey && !apiKeyText.trim()) {
      Alert.alert('Falta a chave', 'Salve primeiro a chave de API para localizar o endereço.');
      return;
    }
    setSavingEnd(true);
    try {
      const key = settings.apiKey || apiKeyText.trim();
      const geo = await geocodeAddress(text, key);
      updateSettings({
        endAddress: { text: geo.formatted, location: geo.location },
        returnToStart: false,
      });
      setEndAddressText(geo.formatted);
      Alert.alert('Pronto', `Ponto de término salvo:\n${geo.formatted}`);
    } catch (e) {
      Alert.alert('Endereço não localizado', e instanceof Error ? e.message : String(e));
    } finally {
      setSavingEnd(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <ScreenTitle title="Ajustes" subtitle="Tudo fica salvo somente no seu celular" />

      <Card>
        <Text style={styles.sectionTitle}>🔑 Chave de API do Google Maps</Text>
        <Text style={styles.help}>
          Necessária para localizar endereços e calcular rotas com trânsito em tempo real. Crie a
          chave no Google Cloud e habilite: Routes API, Geocoding API e Places API (New). Veja o
          passo a passo no README do projeto.
        </Text>
        <Field
          label="Chave de API"
          value={apiKeyText}
          onChangeText={setApiKeyText}
          placeholder="AIza..."
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Button title="Salvar chave" onPress={saveApiKey} small />
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>🏍 Tipo de veículo</Text>
        <Text style={styles.help}>
          O modo moto usa rotas específicas para duas rodas quando disponível na sua região. Se não
          estiver disponível, o app usa a rota de carro automaticamente.
        </Text>
        <View style={styles.modeRow}>
          <TouchableOpacity
            style={[styles.modeOption, settings.travelMode === 'TWO_WHEELER' && styles.modeActive]}
            onPress={() => setMode('TWO_WHEELER')}
          >
            <Text style={styles.modeText}>🏍 Moto</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeOption, settings.travelMode === 'DRIVE' && styles.modeActive]}
            onPress={() => setMode('DRIVE')}
          >
            <Text style={styles.modeText}>🚗 Carro</Text>
          </TouchableOpacity>
        </View>
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>🏁 Ponto de término</Text>
        <Text style={styles.help}>
          Onde você precisa estar ao final das entregas. Pode ser o próprio ponto de partida (ex.:
          voltar para a pizzaria) ou um endereço fixo.
        </Text>
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Voltar ao ponto de partida</Text>
          <Switch
            value={settings.returnToStart}
            onValueChange={(v) => {
              if (!v && !settings.endAddress) {
                Alert.alert(
                  'Defina o endereço',
                  'Digite abaixo o endereço fixo de término e toque em "Salvar término".'
                );
                return;
              }
              updateSettings({ returnToStart: v });
            }}
            trackColor={{ true: colors.accent, false: colors.border }}
            thumbColor={colors.white}
          />
        </View>
        <Field
          label="Endereço fixo de término (opcional)"
          value={endAddressText}
          onChangeText={setEndAddressText}
          placeholder="Ex.: Av. Paulista, 1000, São Paulo"
        />
        <Button title="Salvar término" onPress={saveEndAddress} small loading={savingEnd} />
        {settings.endAddress && !settings.returnToStart && (
          <Text style={styles.currentEnd}>✓ Término atual: {settings.endAddress.text}</Text>
        )}
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>💾 Seus dados</Text>
        <Text style={styles.help}>
          Este app não usa servidor nem banco de dados externo: entregas, histórico e ajustes ficam
          gravados apenas neste celular. Se você desinstalar o app, os dados são apagados.
        </Text>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 6,
  },
  help: {
    color: colors.dim,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 12,
  },
  modeRow: {
    flexDirection: 'row',
  },
  modeOption: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginRight: 8,
    backgroundColor: colors.cardAlt,
  },
  modeActive: {
    borderColor: colors.accent,
    backgroundColor: 'rgba(47, 129, 247, 0.15)',
  },
  modeText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  switchLabel: {
    color: colors.text,
    fontSize: 15,
    flex: 1,
    marginRight: 10,
  },
  currentEnd: {
    color: colors.green,
    fontSize: 13,
    marginTop: 10,
  },
});
