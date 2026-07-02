import { Alert, Linking } from 'react-native';

import { LatLng } from './types';

async function open(url: string, appName: string) {
  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert('Ops', `Não foi possível abrir o ${appName}. Verifique se está instalado.`);
  }
}

export function openInGoogleMaps(destination: LatLng) {
  const dest = `${destination.lat},${destination.lng}`;
  open(`https://www.google.com/maps/dir/?api=1&destination=${dest}&travelmode=driving&dir_action=navigate`, 'Google Maps');
}

export function openInWaze(destination: LatLng) {
  open(`https://waze.com/ul?ll=${destination.lat},${destination.lng}&navigate=yes`, 'Waze');
}
