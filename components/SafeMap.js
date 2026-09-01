import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, Platform, ActivityIndicator, Text } from 'react-native';
import { COLORS } from '../constants/colors';

// Diagnóstico de importación seguro para Native/Web
let WebView;
try {
  if (Platform.OS !== 'web') {
    const RCTWebView = require('react-native-webview');
    WebView = (RCTWebView && RCTWebView.WebView) ? RCTWebView.WebView : (RCTWebView ? RCTWebView.default : null);
  }
} catch (e) {
  console.warn("Error cargando WebView nativo:", e);
}

export default function SafeMap({ children, currentLocation, initialRegion, style, markers = [] }) {
  const webViewRef = useRef(null);
  const [isMounted, setIsMounted] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // --- HTML DEL MAPA LIBRE (LEAFLET) ---
  const mapHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes, viewport-fit=cover" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        html, body { margin: 0; padding: 0; height: 100%; width: 100%; overflow: hidden; background: #E3F2FD; }
        #map { height: 100%; width: 100%; }
        .bus-icon {
          background-color: ${COLORS.PRIMARIO};
          border: 2px solid white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          box-shadow: 0 0 10px rgba(0,0,0,0.5);
          position: relative;
        }
        .bus-icon::after {
          content: "";
          position: absolute;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background-color: ${COLORS.PRIMARIO};
          opacity: 0.5;
          animation: pulse 2s infinite;
          z-index: -1;
        }
        @keyframes pulse {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(2.5); opacity: 0; }
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        try {
          var map = L.map('map', { 
            zoomControl: false,
            dragging: true,
            touchZoom: true,
            doubleClickZoom: true,
            boxZoom: true
          }).setView([${initialRegion?.latitude || 4.5709}, ${initialRegion?.longitude || -74.2973}], 16);
          
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap'
          }).addTo(map);

          var busIcon = L.divIcon({
            className: 'bus-icon',
            html: '🚌',
            iconSize: [35, 35],
            iconAnchor: [17, 17]
          });

          var marker = L.marker([${initialRegion?.latitude || 4.5709}, ${initialRegion?.longitude || -74.2973}], { icon: busIcon }).addTo(map);
          var path = L.polyline([], { color: '${COLORS.TRAYECTO_RECORRIDO}', weight: 6, opacity: 0.8 }).addTo(map);

          // Renderizar marcadores personalizados (Zonas)
          var customMarkers = ${JSON.stringify(markers)};
          if (customMarkers && customMarkers.length > 0) {
             customMarkers.forEach(function(m) {
                var pinHtml = '<div style="background-color:' + (m.color || '#1A4F8A') + '; width:24px; height:24px; border-radius:12px; border:2px solid white; box-shadow: 0 0 5px rgba(0,0,0,0.5);"></div>';
                var customIcon = L.divIcon({
                  className: 'custom-pin',
                  html: pinHtml,
                  iconSize: [24, 24],
                  iconAnchor: [12, 12]
                });
                var leafletMarker = L.marker([m.lat, m.lng], { icon: customIcon }).addTo(map);
                if (m.title) {
                  leafletMarker.bindPopup('<b>' + m.title + '</b>');
                }
             });
          }

          function updateLocation(lat, lng) {
            var newPos = [lat, lng];
            marker.setLatLng(newPos);
            path.addLatLng(newPos);
            map.panTo(newPos, { animate: true });
          }

          function handleMessage(event) {
            var data;
            try {
              data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
              if(data && data.lat && data.lng) { updateLocation(data.lat, data.lng); }
            } catch(e) {}
          }

          window.addEventListener("message", handleMessage);
          document.addEventListener("message", handleMessage);
        } catch(e) {
          document.body.innerHTML = "<div style='padding:20px; color:red;'>Error en Leaflet: " + e.message + "</div>";
        }
      </script>
    </body>
    </html>
  `;

  // --- SINCRO DINAMICA ---
  useEffect(() => {
    if (isMounted && currentLocation && webViewRef.current) {
      const data = { lat: currentLocation.latitude, lng: currentLocation.longitude };
      if (Platform.OS === 'web') {
        webViewRef.current.contentWindow?.postMessage(data, "*");
      } else {
        webViewRef.current.postMessage(JSON.stringify(data));
      }
    }
  }, [currentLocation, isMounted]);

  if (!isMounted) return (
    <View style={[styles.container, style]}>
      <ActivityIndicator size="large" color={COLORS.PRIMARIO} />
    </View>
  );

  // --- RENDER WEB ---
  if (Platform.OS === 'web') {
    return (
      <View style={[styles.container, style]}>
        <iframe
          ref={webViewRef}
          srcDoc={mapHtml}
          style={{ width: '100%', height: '100%', border: 'none' }}
          title="Guardian Escolar Map"
        />
      </View>
    );
  }

  // --- RENDER MOVIL (WebView Nativo) ---
  return (
    <View style={[styles.container, style, { backgroundColor: COLORS.FONDO_PRINCIPAL }]}>
      {WebView ? (
        <WebView
          ref={webViewRef}
          originWhitelist={['*']}
          source={{ html: mapHtml }}
          style={{ flex: 1, backgroundColor: 'transparent' }}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          nestedScrollEnabled={true}
          scrollEnabled={true}
          onMessage={() => {}}
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.warn('WebView error: ', nativeEvent);
            setHasError(true);
          }}
        />
      ) : (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Motor de Mapas no disponible.</Text>
          <Text style={styles.errorText}>Verifica que tienes internet y recarga la App.</Text>
        </View>
      )}
      {hasError && (
        <View style={styles.errorOverlay}>
          <Text>Error al cargar el mapa callejero.</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, overflow: 'hidden' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  errorText: { color: COLORS.PRIMARIO, textAlign: 'center', fontWeight: '500' },
  errorOverlay: { position: 'absolute', top: 50, alignSelf: 'center', backgroundColor: 'rgba(255,255,255,0.8)', padding: 10, borderRadius: 5 }
});
