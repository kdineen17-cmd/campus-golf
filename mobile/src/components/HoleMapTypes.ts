import { StyleProp, ViewStyle } from "react-native";

export interface MapMarkerSpec {
  id: string;
  lat: number;
  lng: number;
  color: string;
  title?: string;
  description?: string;
}

export interface MapPolylineSpec {
  id: string;
  points: { lat: number; lng: number }[];
  color: string;
}

export interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

export interface HoleMapProps {
  region: MapRegion;
  markers: MapMarkerSpec[];
  polylines: MapPolylineSpec[];
  style?: StyleProp<ViewStyle>;
  /** When true, the map recenters as `region` changes (for live position tracking). */
  live?: boolean;
}
