import React, { useEffect, useMemo, useRef } from 'react';
import { View, StyleSheet } from 'react-native';

const DEFAULT_REGION = { latitude: 4.5709, longitude: -74.2973 };

const html = (region) => `<!doctype html><html><head>
<meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>html,body,#map{height:100%;margin:0} .leaflet-container{font:inherit}</style>
</head><body><div id="map"></div><script>
const map=L.map('map').setView([${region.latitude},${region.longitude}],15);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap'}).addTo(map);
const layers={}; let marker;
const point=v=>v&&Number.isFinite(Number(v.latitude??v.lat))&&Number.isFinite(Number(v.longitude??v.lng))
 ? [Number(v.latitude??v.lat),Number(v.longitude??v.lng)] : null;
function draw(data){
 const current=point(data.studentLocation||data.currentLocation);
 if(current){if(!marker)marker=L.marker(current).addTo(map);else marker.setLatLng(current);map.panTo(current);}
 ['trail','route','routePoints','zones'].forEach(k=>{if(layers[k])layers[k].forEach(x=>map.removeLayer(x));layers[k]=[]});
 const trail=(data.trail||[]).map(point).filter(Boolean); if(trail.length>1)layers.trail=[L.polyline(trail,{color:'#1A4F8A',weight:4}).addTo(map)];
 const route=(data.routePath||[]).map(point).filter(Boolean); if(route.length>1)layers.route=[L.polyline(route,{color:'#6B7280',weight:4}).addTo(map)];
 (data.routePoints||[]).map(point).filter(Boolean).forEach((p,i)=>layers.routePoints.push(L.marker(p).bindTooltip((data.routePoints[i]||{}).title||'Parada').addTo(map)));
 (data.safeZones||[]).forEach(z=>{const p=point(z);const r=Number(z.radiusMeters??z.radius);if(p&&r>0)layers.zones.push(L.circle(p,{radius:r,color:'#7BC74D',fillOpacity:.15}).addTo(map));});
}
window.addEventListener('message',e=>{if(e.data?.type==='state')draw(e.data.state)});
map.on('click',e=>parent.postMessage({type:'location',location:{latitude:e.latlng.lat,longitude:e.latlng.lng}},'*'));
</script></body></html>`;

export default function SafeMap({
  currentLocation, studentLocation, trail = [], assignedRoute = [], safeZones = [],
  onLocationSelect, initialRegion = DEFAULT_REGION, style,
}) {
  const frame = useRef(null);
  const routePath = useMemo(() => (Array.isArray(assignedRoute) ? assignedRoute : assignedRoute?.path || []), [assignedRoute]);
  const routePoints = useMemo(() => (Array.isArray(assignedRoute) ? assignedRoute : assignedRoute?.points || []), [assignedRoute]);
  const state = useMemo(() => ({ currentLocation, studentLocation, trail, routePath, routePoints, safeZones }), [
    currentLocation, studentLocation, trail, routePath, routePoints, safeZones,
  ]);
  useEffect(() => {
    const listener = (event) => { if (event.data?.type === 'location') onLocationSelect?.(event.data.location); };
    window.addEventListener('message', listener);
    return () => window.removeEventListener('message', listener);
  }, [onLocationSelect]);
  useEffect(() => { frame.current?.contentWindow?.postMessage({ type: 'state', state }, '*'); }, [state]);
  const publish = () => frame.current?.contentWindow?.postMessage({ type: 'state', state }, '*');
  return <View style={[styles.container, style]}><iframe ref={frame} title="Guardian Escolar map" srcDoc={html(initialRegion)} onLoad={publish} style={styles.frame} /></View>;
}

const styles = StyleSheet.create({ container: { flex: 1, minHeight: 240, overflow: 'hidden' }, frame: { width: '100%', height: '100%', border: 0 } });
