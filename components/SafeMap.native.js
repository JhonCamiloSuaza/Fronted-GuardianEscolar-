import React, { useEffect, useMemo, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

const DEFAULT_REGION = { latitude: 4.5709, longitude: -74.2973 };

function mapDocument(region) {
  return `<!doctype html>
<html>
<head>
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>html,body,#map{height:100%;margin:0}.leaflet-container{font:inherit}</style>
</head>
<body>
  <div id="map"></div>
  <script>
    const map = L.map('map').setView([${region.latitude}, ${region.longitude}], 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);
    const layers = [];
    let marker;

    const point = (value) => {
      if (!value) return null;
      const latitude = Number(value.latitude ?? value.lat);
      const longitude = Number(value.longitude ?? value.lng);
      return Number.isFinite(latitude) && Number.isFinite(longitude)
        ? [latitude, longitude]
        : null;
    };

    function draw(data) {
      const current = point(data.studentLocation || data.currentLocation);
      if (current) {
        if (!marker) marker = L.marker(current).addTo(map);
        else marker.setLatLng(current);
        map.panTo(current);
      }

      layers.splice(0).forEach((layer) => map.removeLayer(layer));
      const trail = (data.trail || []).map(point).filter(Boolean);
      const route = (data.routePath || []).map(point).filter(Boolean);
      if (trail.length > 1) {
        layers.push(L.polyline(trail, { color: '#1A4F8A', weight: 4 }).addTo(map));
      }
      if (route.length > 1) {
        layers.push(L.polyline(route, { color: '#6B7280', weight: 4 }).addTo(map));
      }
      (data.routePoints || []).forEach((value) => {
        const location = point(value);
        if (location) {
          layers.push(L.marker(location)
            .bindTooltip(value.title || value.type || 'Parada')
            .addTo(map));
        }
      });
      (data.safeZones || []).forEach((value) => {
        const location = point(value);
        const radius = Number(value.radiusMeters ?? value.radius);
        if (location && radius > 0) {
          layers.push(L.circle(location, {
            radius,
            color: '#7BC74D',
            fillOpacity: 0.15
          }).addTo(map));
        }
      });
    }

    function receive(event) {
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (data?.type === 'state') draw(data.state);
      } catch (_) {
        // Ignore malformed messages from the host.
      }
    }

    window.addEventListener('message', receive);
    document.addEventListener('message', receive);
    map.on('click', (event) => {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        latitude: event.latlng.lat,
        longitude: event.latlng.lng
      }));
    });
  </script>
</body>
</html>`;
}

export default function SafeMap({
  currentLocation,
  studentLocation,
  trail = [],
  assignedRoute = [],
  safeZones = [],
  onLocationSelect,
  initialRegion = DEFAULT_REGION,
  style,
}) {
  const webView = useRef(null);
  const routePath = useMemo(
    () => (Array.isArray(assignedRoute) ? assignedRoute : assignedRoute?.path || []),
    [assignedRoute]
  );
  const routePoints = useMemo(
    () => (Array.isArray(assignedRoute) ? assignedRoute : assignedRoute?.points || []),
    [assignedRoute]
  );
  const state = useMemo(
    () => ({ currentLocation, studentLocation, trail, routePath, routePoints, safeZones }),
    [currentLocation, studentLocation, trail, routePath, routePoints, safeZones]
  );

  useEffect(() => {
    webView.current?.postMessage(JSON.stringify({ type: 'state', state }));
  }, [state]);

  const publish = () => {
    webView.current?.postMessage(JSON.stringify({ type: 'state', state }));
  };

  return (
    <View style={[styles.container, style]}>
      <WebView
        ref={webView}
        originWhitelist={['*']}
        source={{ html: mapDocument(initialRegion) }}
        javaScriptEnabled
        onLoad={publish}
        onMessage={(event) => {
          try {
            onLocationSelect?.(JSON.parse(event.nativeEvent.data));
          } catch (_) {
            // Ignore malformed map events.
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, minHeight: 240, overflow: 'hidden' },
});
