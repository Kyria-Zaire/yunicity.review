import { feedTheme } from "@/components/feed/feed-theme";
import type { MapBbox, MapEventItem } from "@yunicity/types";
import { MAP_RECENTER, resolveCityMapCenter } from "@yunicity/utils";
import Mapbox, { Camera, MapView, PointAnnotation } from "@rnmapbox/maps";
import type { Camera as MapboxCamera } from "@rnmapbox/maps";
import { useCallback, useRef } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

const MARKER_COLOR = "#2A2FFF";

type EventMapProps = {
  city: string;
  events: MapEventItem[];
  selectedEventId: string | null;
  onSelectEvent: (eventId: string | null) => void;
  onBboxChange: (bbox: MapBbox) => void;
  onRecenterPress: () => void;
};

function visibleBoundsToBbox(bounds: [number[], number[]]): MapBbox {
  const [ne, sw] = bounds;
  const neLon = ne[0] ?? 0;
  const neLat = ne[1] ?? 0;
  const swLon = sw[0] ?? 0;
  const swLat = sw[1] ?? 0;
  return {
    lon_min: Math.min(neLon, swLon),
    lon_max: Math.max(neLon, swLon),
    lat_min: Math.min(neLat, swLat),
    lat_max: Math.max(neLat, swLat),
  };
}

export function EventMap({
  city,
  events,
  selectedEventId,
  onSelectEvent,
  onBboxChange,
  onRecenterPress,
}: EventMapProps) {
  const mapRef = useRef<MapView>(null);
  const cameraRef = useRef<MapboxCamera>(null);
  const center = resolveCityMapCenter(city);

  const syncBounds = useCallback(async () => {
    if (!mapRef.current) return;
    try {
      const bounds = await mapRef.current.getVisibleBounds();
      if (!bounds) return;
      onBboxChange(visibleBoundsToBbox(bounds));
    } catch {
      // Carte pas encore prête
    }
  }, [onBboxChange]);

  const handleRecenter = useCallback(() => {
    const next = resolveCityMapCenter(city);
    cameraRef.current?.setCamera({
      centerCoordinate: [next.longitude, next.latitude],
      zoomLevel: next.zoom,
      animationDuration: 800,
    });
    onRecenterPress();
    void syncBounds();
  }, [city, onRecenterPress, syncBounds]);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        styleURL={Mapbox.StyleURL.Light}
        compassEnabled={false}
        scaleBarEnabled={false}
        logoEnabled={false}
        attributionEnabled={false}
        onDidFinishLoadingMap={() => {
          void syncBounds();
        }}
        onRegionDidChange={() => {
          void syncBounds();
        }}
      >
        <Camera
          ref={cameraRef}
          defaultSettings={{
            centerCoordinate: [center.longitude, center.latitude],
            zoomLevel: center.zoom,
          }}
        />
        {events.map((event) => (
          <PointAnnotation
            key={event.id}
            id={event.id}
            coordinate={[event.longitude, event.latitude]}
            onSelected={() => onSelectEvent(event.id)}
            onDeselected={() => {
              if (selectedEventId === event.id) onSelectEvent(null);
            }}
          >
            <Pressable
              onPress={() => onSelectEvent(event.id)}
              style={[
                styles.marker,
                selectedEventId === event.id ? styles.markerSelected : null,
              ]}
              accessibilityLabel={event.title}
            />
          </PointAnnotation>
        ))}
      </MapView>
      <Pressable style={styles.recenterBtn} onPress={handleRecenter}>
        <Text style={styles.recenterText}>{MAP_RECENTER(city)}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, minHeight: 320 },
  map: { flex: 1 },
  marker: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: MARKER_COLOR,
    borderWidth: 2,
    borderColor: "#fff",
  },
  markerSelected: {
    transform: [{ scale: 1.2 }],
  },
  recenterBtn: {
    position: "absolute",
    bottom: 16,
    left: 16,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: feedTheme.border,
    backgroundColor: "rgba(255,255,255,0.95)",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  recenterText: { fontSize: 12, fontWeight: "600", color: feedTheme.text },
});
