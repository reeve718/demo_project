<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import maplibregl, { Map as MapLibreMap } from 'maplibre-gl';

import type { BboxTuple, GeoFeature, MapFeatureClick } from '../../types';

interface LayerDescriptor {
  slug: string;
  features: GeoFeature[];
  visible: boolean;
  color: string;
}

interface Props {
  layers: LayerDescriptor[];
  selectedFeature: { feature: GeoFeature; datasetSlug: string } | null;
  fitTarget: BboxTuple | null;
}
const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'bbox-change', bbox: BboxTuple): void;
  (e: 'feature-click', payload: MapFeatureClick): void;
  (e: 'map-ready'): void;
}>();

const mapContainer = ref<HTMLDivElement | null>(null);
let map: MapLibreMap | null = null;

// Per-slug bookkeeping: source id + the three sublayer ids + click handler
// refs so we can clean everything up atomically when a layer is removed.
interface LayerHandles {
  sourceId: string;
  fillLayer: string;
  lineLayer: string;
  pointLayer: string;
}
const handles = new Map<string, LayerHandles>();

function sourceIdFor(slug: string) {
  return `geocatalog-features-${slug}`;
}
function fillLayerFor(slug: string) {
  return `${sourceIdFor(slug)}-fill`;
}
function lineLayerFor(slug: string) {
  return `${sourceIdFor(slug)}-line`;
}
function pointLayerFor(slug: string) {
  return `${sourceIdFor(slug)}-point`;
}

function toFeatureCollection(slug: string, features: GeoFeature[]): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: features.map((f) => ({
      type: 'Feature',
      id: f.id,
      geometry: f.geometry,
      properties: { ...(f.properties ?? {}), _id: f.id, _datasetSlug: slug },
    })),
  };
}

function upsertLayer(layer: LayerDescriptor) {
  if (!map) return;
  const sourceId = sourceIdFor(layer.slug);
  const fc = toFeatureCollection(layer.slug, layer.features);

  let h = handles.get(layer.slug);
  if (!h) {
    h = {
      sourceId,
      fillLayer: fillLayerFor(layer.slug),
      lineLayer: lineLayerFor(layer.slug),
      pointLayer: pointLayerFor(layer.slug),
    };
    handles.set(layer.slug, h);

    map.addSource(sourceId, { type: 'geojson', data: fc });

    map.addLayer({
      id: h.fillLayer,
      type: 'fill',
      source: sourceId,
      filter: ['==', ['geometry-type'], 'Polygon'],
      paint: {
        'fill-color': layer.color,
        'fill-opacity': 0.25,
      },
    });
    map.addLayer({
      id: h.lineLayer,
      type: 'line',
      source: sourceId,
      filter: ['any', ['==', ['geometry-type'], 'Polygon'], ['==', ['geometry-type'], 'LineString']],
      paint: { 'line-color': layer.color, 'line-width': 1.5 },
    });
    map.addLayer({
      id: h.pointLayer,
      type: 'circle',
      source: sourceId,
      filter: ['==', ['geometry-type'], 'Point'],
      paint: {
        'circle-radius': 6,
        'circle-color': layer.color,
        'circle-stroke-color': '#fff',
        'circle-stroke-width': 2,
      },
    });

    // Click + cursor handlers per layer.
    const onClick = (event: maplibregl.MapMouseEvent & { features?: maplibregl.MapGeoJSONFeature[] }) => {
      const f = event.features?.[0];
      if (!f) return;
      const props = (f.properties ?? {}) as Record<string, unknown>;
      const id = String(props._id ?? f.id ?? '');
      if (!id) return;
      emit('feature-click', {
        feature: {
          type: 'Feature',
          id,
          geometry: f.geometry as GeoJSON.Geometry,
          properties: props,
        },
        datasetSlug: layer.slug,
      });
    };
    map.on('click', h.pointLayer, onClick);
    map.on('click', h.fillLayer, onClick);

    const setCursor = (cursor: string) => {
      if (map) map.getCanvas().style.cursor = cursor;
    };
    map.on('mouseenter', h.pointLayer, () => setCursor('pointer'));
    map.on('mouseleave', h.pointLayer, () => setCursor(''));
    map.on('mouseenter', h.fillLayer, () => setCursor('pointer'));
    map.on('mouseleave', h.fillLayer, () => setCursor(''));
  } else {
    const source = map.getSource(sourceId) as maplibregl.GeoJSONSource | undefined;
    if (source) source.setData(fc);
  }

  setLayerVisibility(layer.slug, layer.visible);
}

function removeLayer(slug: string) {
  if (!map) return;
  const h = handles.get(slug);
  if (!h) return;
  handles.delete(slug);
  for (const layerId of [h.fillLayer, h.lineLayer, h.pointLayer]) {
    if (map.getLayer(layerId)) map.removeLayer(layerId);
  }
  if (map.getSource(h.sourceId)) map.removeSource(h.sourceId);
}

function setLayerVisibility(slug: string, visible: boolean) {
  if (!map) return;
  const h = handles.get(slug);
  if (!h) return;
  const value = visible ? 'visible' : 'none';
  for (const layerId of [h.fillLayer, h.lineLayer, h.pointLayer]) {
    if (map.getLayer(layerId)) map.setLayoutProperty(layerId, 'visibility', value);
  }
}

function applyVisibilityAll() {
  for (const layer of props.layers) {
    setLayerVisibility(layer.slug, layer.visible);
  }
}

/**
 * Resync the map with the layers prop. For each slug:
 *   - if present in the new list, upsert; otherwise remove.
 * Upserted layers are added in the order they appear in `props.layers`,
 * which is the order in which MapView (page) hands them down — newest on top.
 */
function syncLayers() {
  if (!map) return;
  const nextSlugs = new Set(props.layers.map((l) => l.slug));
  // Remove layers that are no longer in the prop.
  for (const slug of [...handles.keys()]) {
    if (!nextSlugs.has(slug)) removeLayer(slug);
  }
  for (const layer of props.layers) {
    upsertLayer(layer);
  }
}

function applyHighlight() {
  if (!map) return;
  // Clear previous highlight by resetting all point layers to their base colour,
  // then paint the selected feature in amber for the matching layer only.
  for (const [slug, h] of handles.entries()) {
    const layer = props.layers.find((l) => l.slug === slug);
    if (!layer) continue;
    const base = layer.color;
    const sel = props.selectedFeature;
    if (sel && sel.datasetSlug === slug && map.getLayer(h.pointLayer)) {
      map.setPaintProperty(h.pointLayer, 'circle-color', [
        'case',
        ['==', ['get', '_id'], sel.feature.id],
        '#f59e0b',
        base,
      ]);
    } else if (map.getLayer(h.pointLayer)) {
      map.setPaintProperty(h.pointLayer, 'circle-color', base);
    }
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
    syncLayers();
    applyHighlight();
    emit('map-ready');
    emitBbox();
  });

  map.on('moveend', emitBbox);
});

watch(
  () => props.layers,
  () => {
    syncLayers();
    applyHighlight();
  },
  { deep: true },
);

watch(
  () => props.selectedFeature,
  () => applyHighlight(),
  { deep: true },
);

watch(
  () => props.fitTarget,
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
    handles.clear();
  }
});

/**
 * Public API: programmatically zoom to a single feature (called from the
 * parent after the user clicks "Zoom to feature" in the details panel).
 */
function zoomToFeature(feature: GeoFeature) {
  if (!map) return;
  const geom = feature.geometry;
  if (geom.type === 'Point') {
    map.flyTo({ center: geom.coordinates as [number, number], zoom: 14, duration: 800 });
    return;
  }
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
  if (geom.type === 'GeometryCollection') {
    geom.geometries.forEach((g) => walk(extractCoords(g) as unknown));
  } else {
    walk((geom as Extract<GeoJSON.Geometry, { coordinates: unknown }>).coordinates);
  }
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
