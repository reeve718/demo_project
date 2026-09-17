<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import AppError from '../components/common/AppError.vue';
import AppLoading from '../components/common/AppLoading.vue';
import DatasetSelector from '../components/map/DatasetSelector.vue';
import EmptyState from '../components/common/EmptyState.vue';
import FeatureDetails from '../components/map/FeatureDetails.vue';
import LayerPanel from '../components/map/LayerPanel.vue';
import MapLoadingIndicator from '../components/map/MapLoadingIndicator.vue';
import MapView from '../components/map/MapView.vue';
import MobileMapDrawer from '../components/map/MobileMapDrawer.vue';
import { useMapFeatureQuery } from '../composables/useMapFeatureQuery';
import { listDatasets } from '../api/datasets';
import { useMapStore } from '../stores/map';
import type { BboxTuple, DatasetDetail, GeoFeature } from '../types';

const route = useRoute();
const mapStore = useMapStore();

const datasets = ref<DatasetDetail[]>([]);
const datasetsLoading = ref<boolean>(true);
const datasetsError = ref<string>('');
const mapReady = ref<boolean>(false);

const mapRef = ref<InstanceType<typeof MapView> | null>(null);
const drawerOpen = ref<boolean>(false);

const initialSlug = computed(() => String(route.query.dataset ?? ''));
const bbox = ref<BboxTuple | null>(null);

const { features, watchBbox } = useMapFeatureQuery();

watchBbox(bbox);

async function loadDatasets() {
  datasetsLoading.value = true;
  datasetsError.value = '';
  try {
    // List page size is 50 (the API maximum) so the selector covers the
    // small synthetic catalogue without further pagination logic.
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

function selectDataset(slug: string) {
  mapStore.selectDataset(slug);
  drawerOpen.value = false;
  if (bbox.value) {
    mapStore.setCurrentBbox(bbox.value);
  }
}

function onBboxChange(next: BboxTuple) {
  bbox.value = next;
  mapStore.setCurrentBbox(next);
}

function onFeatureClick(feature: GeoFeature) {
  mapStore.selectFeature(feature);
}

function zoomToSelected() {
  if (mapStore.selectedFeature && mapRef.value) {
    mapRef.value.zoomToFeature(mapStore.selectedFeature);
  }
}

function closeFeature() {
  mapStore.clearSelectedFeature();
}

onMounted(async () => {
  await loadDatasets();
  if (initialSlug.value) {
    selectDataset(initialSlug.value);
  }
});

watch(initialSlug, (slug) => {
  if (slug && slug !== mapStore.selectedDatasetSlug) {
    selectDataset(slug);
  }
});
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
          :selected-slug="mapStore.selectedDatasetSlug"
          :layer-visible="mapStore.isLayerVisible"
          @select="selectDataset"
          @toggle-visibility="mapStore.toggleLayerVisibility()"
        />

        <DatasetSelector
          class="mobile-only-selector"
          :datasets="datasets"
          :selected-slug="mapStore.selectedDatasetSlug"
          @select="selectDataset"
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
          :status="mapStore.featureLoadingStatus"
          :error-message="mapStore.featureErrorMessage"
          :visible="mapStore.featureLoadingStatus !== 'idle'"
        />

        <MapView
          ref="mapRef"
          :features="features"
          :bbox="mapStore.selectedDatasetSlug ? datasets.find((d) => d.slug === mapStore.selectedDatasetSlug)?.bbox ?? null : null"
          :selected-feature-id="mapStore.selectedFeature?.id ?? null"
          :layer-visible="mapStore.isLayerVisible"
          @bbox-change="onBboxChange"
          @feature-click="onFeatureClick"
          @map-ready="mapReady = true"
        />

        <EmptyState
          v-if="
            mapReady &&
            mapStore.selectedDatasetSlug &&
            mapStore.featureLoadingStatus === 'empty'
          "
          class="map-empty"
          title="No features in this view"
          message="Pan or zoom the map to load features for this dataset."
        />
      </section>

      <!-- Right panel: selected feature details -->
      <aside class="right-panel" aria-label="Selected feature">
        <FeatureDetails
          v-if="mapStore.selectedFeature"
          :feature="mapStore.selectedFeature"
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
        :selected-slug="mapStore.selectedDatasetSlug"
        :layer-visible="mapStore.isLayerVisible"
        @select="selectDataset"
        @toggle-visibility="mapStore.toggleLayerVisibility()"
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
  grid-template-columns: 280px 1fr 320px;
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