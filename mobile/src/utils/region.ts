import { LatLng } from "../api";

export function regionForPoints(points: LatLng[], paddingFactor = 1.8) {
  if (points.length === 0) {
    return { latitude: 0, longitude: 0, latitudeDelta: 0.01, longitudeDelta: 0.01 };
  }
  const lats = points.map((p) => p.lat);
  const lngs = points.map((p) => p.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  const latitude = (minLat + maxLat) / 2;
  const longitude = (minLng + maxLng) / 2;
  const latitudeDelta = Math.max((maxLat - minLat) * paddingFactor, 0.0015);
  const longitudeDelta = Math.max((maxLng - minLng) * paddingFactor, 0.0015);

  return { latitude, longitude, latitudeDelta, longitudeDelta };
}
