<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import maplibregl, { Map as MapLibreMap } from 'maplibre-gl';

import type { BboxTuple, GeoFeature } from '../../types';

interface Props {
  features: GeoFeature[];
  bbox: BboxTuple | null;
  selectedFeatureId: string | null;
  layerVisible: boolean;
}
const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'bbox-change', bbox: BboxTuple): void;
  (e: 'feature-click', feature: GeoFeature): void;
  (e: 'map-ready'): void;
}>();

const mapContainer = ref<HTMLDivElement | null>(null);
let map: MapLibreMap | null = null;

const SOURCE_ID = 'geocatalog-features';
const FILL_LAYER = 'geocatalog-features-fill';
const LINE_LAYER = 'geocatalog-features-line';
const POINT_LAYER = 'geocatalog-features-point';

function setSource(features: GeoFeature[]) {
  if (!map) return;
  const source = map.getSource(SOURCE_ID) as maplibregl.GeoJSONSource | undefined;
  const fc: GeoJSON.FeatureCollection = {
    type: 'FeatureCollection',
    features: features.map((f) => ({
      type: 'Feature',
      id: f.id,
      geometry: f.geometry,
      properties: { ...f.properties, _id: f.id },
    })),
  };
  if (source) {
    source.setData(fc);
  } else {
    map.addSource(SOURCE_ID, { type: 'geojson', data: fc });
    map.addLayer({
      id: FILL_LAYER,
      type: 'fill',
      source: SOURCE_ID,
      filter: ['==', ['geometry-type'], 'Polygon'],
      paint: { 'fill-color': '#1d4ed8', 'fill-opacity': 0.25 },
    });
    map.addLayer({
      id: LINE_LAYER,
      type: 'line',
      source: SOURCE_ID,
      filter: ['any', ['==', ['geometry-type'], 'Polygon'], ['==', ['geometry-type'], 'LineString']],
      paint: { 'line-color': '#1e3a8a', 'line-width': 1.5 },
    });
    map.addLayer({
      id: POINT_LAYER,
      type: 'circle',
      source: SOURCE_ID,
      filter: ['==', ['geometry-type'], 'Point'],
      paint: {
        'circle-radius': 6,
        'circle-color': '#1d4ed8',
        'circle-stroke-color': '#fff',
        'circle-stroke-width': 2,
      },
    });
  }
}

function setLayerVisibility(visible: boolean) {
  if (!map) return;
  const value = visible ? 'visible' : 'none';
  [FILL_LAYER, LINE_LAYER, POINT_LAYER].forEach((id) => {
    if (map!.getLayer(id)) map!.setLayoutProperty(id, 'visibility', value);
  });
}

function highlightFeature(featureId: string | null) {
  if (!map) return;
  // Reset previous selection styling by re-toggling layer visibility.
  // (A production app would use a feature-state based highlight.)
  setSource(props.features);
  if (featureId && map.getLayer(POINT_LAYER)) {
    map.setPaintProperty(POINT_LAYER, 'circle-color', [
      'case',
      ['==', ['get', '_id'], featureId],
      '#f59e0b',
      '#1d4ed8',
    ]);
  }
}

function emitBbox() {
  if (!map) return;
  const b = map.getBounds();
  emit('bbox-change', [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()]);
}

onMounted(async () => {
  if (!mapContainer.value) return;
  try {
    map = new maplibregl.Map({
      container: mapContainer.value,
      style: '/map-style.json',
      center: [114.18, 22.32],
      zoom: 11,
      attributionControl: false,
    });
  } catch (err) {
    console.error('Failed to initialise MapLibre', err);
    return;
  }

  map.addControl(new maplibregl.NavigationControl({ visualizePitch: false }), 'top-right');
  map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');

  map.on('load', () => {
    if (!map) return;
    setSource(props.features);
    setLayerVisibility(props.layerVisible);
    emit('map-ready');
    emitBbox();
  });

  map.on('moveend', emitBbox);

  map.on('click', POINT_LAYER, (event) => {
    const f = event.features?.[0];
    if (!f) return;
    const props = (f.properties ?? {}) as Record<string, unknown>;
    const id = String(props._id ?? f.id ?? '');
    if (!id) return;
    emit('feature-click', {
      type: 'Feature',
      id,
      geometry: f.geometry as GeoJSON.Geometry,
      properties: props,
    });
  });

  map.on('click', FILL_LAYER, (event) => {
    const f = event.features?.[0];
    if (!f) return;
    const props = (f.properties ?? {}) as Record<string, unknown>;
    const id = String(props._id ?? f.id ?? '');
    if (!id) return;
    emit('feature-click', {
      type: 'Feature',
      id,
      geometry: f.geometry as GeoJSON.Geometry,
      properties: props,
    });
  });

  // Cursor feedback
  const setCursor = (cursor: string) => {
    if (map) map.getCanvas().style.cursor = cursor;
  };
  map.on('mouseenter', POINT_LAYER, () => setCursor('pointer'));
  map.on('mouseleave', POINT_LAYER, () => setCursor(''));
  map.on('mouseenter', FILL_LAYER, () => setCursor('pointer'));
  map.on('mouseleave', FILL_LAYER, () => setCursor(''));
});

watch(
  () => props.features,
  (next) => setSource(next),
  { deep: true },
);

watch(
  () => props.layerVisible,
  (next) => setLayerVisibility(next),
);

watch(
  () => props.selectedFeatureId,
  (next) => highlightFeature(next),
);

watch(
  () => props.bbox,
  (next) => {
    if (!map || !next) return;
    map.fitBounds(
      [
        [next[0], next[1]],
        [next[2], next[3]],
      ],
      { padding: 40, duration: 600, maxZoom: 14 },
    );
  },
);

onBeforeUnmount(() => {
  if (map) {
    map.remove();
    map = null;
  }
});

/**
 * Public API for the parent to programmatically zoom to a single feature.
 */
function zoomToFeature(feature: GeoFeature) {
  if (!map) return;
  const geom = feature.geometry;
  if (geom.type === 'Point') {
    map.flyTo({ center: geom.coordinates as [number, number], zoom: 14, duration: 800 });
    return;
  }
  // For polygons/lines, compute the bbox from coordinates and fit.
  const coords = extractCoords(geom);
  if (coords.length === 0) return;
  let minLon = coords[0][0];
  let minLat = coords[0][1];
  let maxLon = coords[0][0];
  let maxLat = coords[0][1];
  for (const [lon, lat] of coords) {
    if (lon < minLon) minLon = lon;
    if (lon > maxLon) maxLon = lon;
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
  }
  map.fitBounds(
    [
      [minLon, minLat],
      [maxLon, maxLat],
    ],
    { padding: 60, duration: 800, maxZoom: 16 },
  );
}

function extractCoords(geom: GeoJSON.Geometry): [number, number][] {
  const out: [number, number][] = [];
  const walk = (n: unknown) => {
    if (!n) return;
    if (Array.isArray(n)) {
      if (typeof n[0] === 'number' && typeof n[1] === 'number') {
        out.push([n[0], n[1]]);
        return;
      }
      n.forEach(walk);
    }
  };
  walk(geom.coordinates);
  return out;
}

defineExpose({ zoomToFeature });
</script>

<template>
  <div ref="mapContainer" class="maplibre-map" data-testid="maplibre-container" />
</template>

<style scoped>
.maplibre-map {
  width: 100%;
  height: 100%;
  background: #eef3f7;
}
</style>