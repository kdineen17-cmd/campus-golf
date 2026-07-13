import * as Location from "expo-location";
import { LatLng } from "../api";

export class LocationPermissionError extends Error {
  constructor() {
    super("Location permission is required. Enable it in your device settings.");
    this.name = "LocationPermissionError";
  }
}

export async function ensureLocationPermission(): Promise<void> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== "granted") {
    throw new LocationPermissionError();
  }
}

export async function getCurrentLatLng(): Promise<LatLng> {
  await ensureLocationPermission();
  const position = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.High,
  });
  return { lat: position.coords.latitude, lng: position.coords.longitude };
}
