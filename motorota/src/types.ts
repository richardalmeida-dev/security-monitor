export type LatLng = {
  lat: number;
  lng: number;
};

export type DeliveryStatus = 'pending' | 'delivered';

export type Delivery = {
  id: string;
  customerName: string;
  item: string;
  value: number; // em reais
  address: string;
  location?: LatLng;
  status: DeliveryStatus;
  createdAt: string; // ISO
  deliveredAt?: string; // ISO
};

export type TravelMode = 'TWO_WHEELER' | 'DRIVE';

export type Settings = {
  apiKey: string;
  travelMode: TravelMode;
  /** true = a rota termina de volta no ponto de partida */
  returnToStart: boolean;
  /** endereço fixo de término, usado quando returnToStart = false */
  endAddress?: {
    text: string;
    location: LatLng;
  };
};

export type RouteStop = {
  deliveryId: string;
  /** duração do trecho que chega até esta parada, em segundos (com trânsito) */
  legDurationSec: number;
  legDistanceMeters: number;
};

export type OptimizedRoute = {
  generatedAt: string; // ISO
  origin: { text: string; location: LatLng };
  destination: { text: string; location: LatLng };
  stops: RouteStop[];
  /** trecho da última parada até o ponto de término */
  finalLeg: { durationSec: number; distanceMeters: number };
  totalDurationSec: number;
  totalDistanceMeters: number;
  travelMode: TravelMode;
};
