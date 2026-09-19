<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import AppError from '../components/common/AppError.vue';
import AppLoading from '../components/common/AppLoading.vue';
import DatasetSelector from '../components/map/DatasetSelector.vue';
import EmptyState from '../components/common/EmptyState.vue';
import FeatureDetails from '../components/map/FeatureDetails.vue';
import LayerPanel from '../components/map/LayerPanel.vue';
import MapLoadingIndicator from '../components/map/MapLoadingIndicator.vue';
import MapView from '../components/map/MapView.vue';
import MobileMapDrawer from '../components/map/MobileMapDrawer.vue';
import { useMapLayerQueries } from '../composables/useMapLayerQueries';
import { listDatasets } from '../api/datasets';
import { useMapStore } from '../stores/map';
import type { BboxTuple, DatasetDetail, RequestStatus } from '../types';

const route = useRoute();
const router = useRouter();
const mapStore = useMapStore();

const datasets = ref<DatasetDetail[]>([]);
const datasetsLoading = ref<boolean>(true);
const datasetsError = ref<string>('');
const mapReady = ref<boolean>(false);
const fitTarget = ref<BboxTuple | null>(null);

const mapRef = ref<InstanceType<typeof MapView> | null>(null);
const drawerOpen = ref<boolean>(false);

const bbox = ref<BboxTuple | null>(null);

const { watchBbox } = useMapLayerQueries();
watchBbox(bbox);

async function loadDatasets() {
  datasetsLoading.value = true;
  datasetsError.value = '';
  try {
    const result = await listDatasets({ pageSize: 50 });
    datasets.value = result.items.map((item) => ({ ...item, fields: [] }));
  } catch (err) {
    datasetsError.value =
      (err as { error?: { message?: string } })?.error?.message ??
      (err instanceof Error ? err.message : 'Failed to load datasets');
  } finally {
    datasetsLoading.value = false;
  }
}

function datasetBySlug(slug: string): DatasetDetail | undefined {
  return datasets.value.find((d) => d.slug === slug);
}

function datasetTitle(slug: string): string {
  return datasetBySlug(slug)?.title ?? slug;
}

const orderedLayers = computed(() =>
  mapStore.activeDatasetSlugs
    .map((slug) => mapStore.layers[slug])
    .filter((l): l is NonNullable<typeof l> => Boolean(l)),
);

const layerDescriptors = computed(() =>
  orderedLayers.value.map((l) => ({
    slug: l.slug,
    features: l.features,
    visible: l.visible,
    color: l.color,
  })),
);

const excludeSlugs = computed(() => mapStore.activeDatasetSlugs);

/** Aggregate status across layers for the loading indicator. */
const aggregateStatus = computed<RequestStatus>(() => {
  const layers = orderedLayers.value;
  if (layers.length === 0) return 'idle';
  if (layers.some((l) => l.status === 'loading')) return 'loading';
  if (layers.some((l) => l.status === 'error')) return 'error';
  if (layers.every((l) => l.status === 'empty' || l.status === 'success') &&
      layers.every((l) => l.features.length === 0)) return 'empty';
  return 'success';
});

const aggregateError = computed(() => {
  const errLayer = orderedLayers.value.find((l) => l.status === 'error');
  return errLayer?.errorMessage ?? '';
});

function parseSeedSlugs(): string[] {
  const q = route.query;
  if (typeof q.datasets === 'string' && q.datasets.length > 0) {
    return q.datasets
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }
  // Backward compatibility: old single-dataset URL.
  if (typeof q.dataset === 'string' && q.dataset.length > 0) {
    return [q.dataset];
  }
  return [];
}

function onBboxChange(next: BboxTuple) {
  bbox.value = next;
  mapStore.setViewport(next);
}

function onFeatureClick(payload: { feature: import('../types').GeoFeature; datasetSlug: string }) {
  mapStore.selectFeature(payload.feature, payload.datasetSlug);
}

function onToggleVisibility(slug: string) {
  mapStore.toggleVisibility(slug);
}

function onRemoveLayer(slug: string) {
  if (mapStore.selectedFeature?.datasetSlug === slug) {
    mapStore.clearSelectedFeature();
  }
  mapStore.removeDataset(slug);
}

function onFitLayer(slug: string) {
  const bbox = mapStore.layers[slug]?.bbox ?? datasetBySlug(slug)?.bbox ?? null;
  if (bbox) fitTarget.value = bbox;
}

function onFitAll() {
  const bboxes = orderedLayers.value
    .map((l) => l.bbox ?? datasetBySlug(l.slug)?.bbox ?? null)
    .filter((b): b is BboxTuple => b !== null);
  if (bboxes.length === 0) return;
  let minLon = Infinity;
  let minLat = Infinity;
  let maxLon = -Infinity;
  let maxLat = -Infinity;
  for (const b of bboxes) {
    if (b[0] < minLon) minLon = b[0];
    if (b[1] < minLat) minLat = b[1];
    if (b[2] > maxLon) maxLon = b[2];
    if (b[3] > maxLat) maxLat = b[3];
  }
  fitTarget.value = [minLon, minLat, maxLon, maxLat];
}

function onClearAll() {
  mapStore.clearAll();
}

function onAddLayer(slug: string) {
  // The detail page is the primary add path, but allow adding from the
  // map page too so users can stack layers without round-tripping.
  mapStore.addDataset(slug);
  // Update URL too so it stays shareable.
  void router.replace({
    path: '/map',
    query: { datasets: mapStore.activeDatasetSlugs.join(',') },
  });
}

function zoomToSelected() {
  if (mapStore.selectedFeature && mapRef.value) {
    mapRef.value.zoomToFeature(mapStore.selectedFeature.feature);
  }
}

function closeFeature() {
  mapStore.clearSelectedFeature();
}

onMounted(async () => {
  await loadDatasets();
  const seed = parseSeedSlugs();
  if (seed.length > 0) {
    mapStore.seedFromSlugs(seed);
  }
});

// After seeding, hydrate layer titles + bboxes from the catalogue so the
// panel can show human-friendly names before the first bbox query lands.
watch(
  () => [datasets.value, mapStore.activeDatasetSlugs.slice()] as const,
  ([ds, slugs]) => {
    for (const slug of slugs) {
      const dsEntry = (ds as DatasetDetail[]).find((d) => d.slug === slug);
      if (dsEntry) {
        mapStore.setLayerTitle(slug, dsEntry.title);
        mapStore.setLayerBbox(slug, dsEntry.bbox);
      }
    }
  },
  { immediate: true },
);

// Keep the URL in sync with the active set without polluting history.
watch(
  () => mapStore.activeDatasetSlugs.slice(),
  (slugs) => {
    const current = typeof route.query.datasets === 'string'
      ? route.query.datasets
      : (typeof route.query.dataset === 'string' ? route.query.dataset : '');
    const next = slugs.join(',');
    if (current === next) return;
    void router.replace({
      path: '/map',
      query: slugs.length > 0 ? { datasets: next } : {},
    });
  },
);
</script>

<template>
  <div class="map-page">
    <AppLoading v-if="datasetsLoading && datasets.length === 0" label="Loading datasets…" />

    <AppError
      v-else-if="datasetsError"
      title="Could not load datasets"
      :message="datasetsError"
      show-retry
      @retry="loadDatasets"
    />

    <div v-else class="map-grid">
      <!-- Left panel: layer controls -->
      <aside class="left-panel" aria-label="Layer controls">
        <LayerPanel
          :datasets="datasets"
          :layers="mapStore.layers"
          @toggle-visibility="onToggleVisibility"
          @remove="onRemoveLayer"
          @fit="onFitLayer"
          @fit-all="onFitAll"
          @clear-all="onClearAll"
        />

        <DatasetSelector
          class="mobile-only-selector"
          :datasets="datasets"
          :exclude-slugs="excludeSlugs"
          @add="onAddLayer"
        />
      </aside>

      <!-- Main map -->
      <section class="map-stage">
        <button
          class="mobile-drawer-toggle"
          type="button"
          aria-label="Open layers"
          @click="drawerOpen = true"
        >
          ☰ Layers
        </button>

        <MapLoadingIndicator
          :status="aggregateStatus"
          :error-message="aggregateError"
          :visible="aggregateStatus !== 'idle'"
        />

        <MapView
          ref="mapRef"
          :layers="layerDescriptors"
          :selected-feature="mapStore.selectedFeature"
          :fit-target="fitTarget"
          @bbox-change="onBboxChange"
          @feature-click="onFeatureClick"
          @map-ready="mapReady = true"
        />

        <EmptyState
          v-if="
            mapReady &&
            orderedLayers.length > 0 &&
            aggregateStatus === 'empty'
          "
          class="map-empty"
          title="No features in this view"
          message="Pan or zoom the map to load features for the active layers."
        />
      </section>

      <!-- Right panel: selected feature details -->
      <aside class="right-panel" aria-label="Selected feature">
        <FeatureDetails
          v-if="mapStore.selectedFeature"
          :feature="mapStore.selectedFeature.feature"
          :dataset-title="datasetTitle(mapStore.selectedFeature.datasetSlug)"
          @zoom="zoomToSelected"
          @close="closeFeature"
        />
        <EmptyState
          v-else
          title="Click a feature"
          message="Tap any feature on the map to see its attributes here."
        />
      </aside>
    </div>

    <MobileMapDrawer :open="drawerOpen" title="Map layers" @close="drawerOpen = false">
      <LayerPanel
        :datasets="datasets"
        :layers="mapStore.layers"
        @toggle-visibility="onToggleVisibility"
        @remove="onRemoveLayer"
        @fit="onFitLayer"
        @fit-all="onFitAll"
        @clear-all="onClearAll"
      />
      <DatasetSelector
        :datasets="datasets"
        :exclude-slugs="excludeSlugs"
        @add="onAddLayer"
      />
    </MobileMapDrawer>
  </div>
</template>

<style scoped>
.map-page {
  position: relative;
  height: calc(100vh - 56px);
  min-height: 480px;
}
.map-grid {
  display: grid;
  grid-template-columns: 300px 1fr 320px;
  height: 100%;
  gap: 0;
}
.left-panel,
.right-panel {
  background: #f9fafb;
  padding: 0.85rem;
  border-right: 1px solid #e5e7eb;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}
.right-panel {
  border-right: 0;
  border-left: 1px solid #e5e7eb;
}
.map-stage {
  position: relative;
  background: #eef3f7;
  overflow: hidden;
}
.map-empty {
  position: absolute;
  bottom: 1rem;
  left: 50%;
  transform: translateX(-50%);
  width: min(420px, 90%);
  z-index: 5;
}
.mobile-drawer-toggle {
  display: none;
  position: absolute;
  top: 0.75rem;
  left: 0.75rem;
  z-index: 15;
  background: #fff;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  padding: 0.45rem 0.75rem;
  font-size: 0.9rem;
  cursor: pointer;
  min-height: 40px;
}
.mobile-only-selector {
  display: none;
}

/* Tablet: single sidebar */
@media (max-width: 1024px) {
  .map-grid {
    grid-template-columns: 1fr 280px;
  }
  .left-panel {
    display: none;
  }
  .mobile-drawer-toggle {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
  }
  .mobile-only-selector {
    display: flex;
  }
}

/* Mobile: full-screen map, bottom sheet for details */
@media (max-width: 768px) {
  .map-grid {
    grid-template-columns: 1fr;
    grid-template-rows: 1fr auto;
  }
  .right-panel {
    border-left: 0;
    border-top: 1px solid #e5e7eb;
    max-height: 40vh;
  }
  .map-empty {
    bottom: auto;
    top: 3rem;
  }
}
</style>
