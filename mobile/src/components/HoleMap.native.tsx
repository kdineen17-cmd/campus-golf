import MapView, { Marker, Polyline } from "react-native-maps";
import { HoleMapProps } from "./HoleMapTypes";

export function HoleMap({ region, markers, polylines, style, live }: HoleMapProps) {
  return (
    <MapView style={style} region={live ? region : undefined} initialRegion={live ? undefined : region}>
      {markers.map((m) => (
        <Marker
          key={m.id}
          coordinate={{ latitude: m.lat, longitude: m.lng }}
          pinColor={m.color}
          title={m.title}
          description={m.description}
        />
      ))}
      {polylines.map((p) => (
        <Polyline
          key={p.id}
          coordinates={p.points.map((pt) => ({ latitude: pt.lat, longitude: pt.lng }))}
          strokeColor={p.color}
          strokeWidth={3}
        />
      ))}
    </MapView>
  );
}
