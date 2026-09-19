import { defineStore } from 'pinia';

import type { ActiveLayerState, BboxTuple, GeoFeature, RequestStatus } from '../types';

/**
 * Deterministic 8-colour palette cycled in insertion order. Each active
 * layer is assigned a colour when it is first added so toggling
 * visibility never reshuffles the swatches.
 */
export const LAYER_COLORS = [
  '#e74c3c',
  '#3498db',
  '#2ecc71',
  '#f39c12',
  '#9b59b6',
  '#1abc9c',
  '#e67e22',
  '#34495e',
] as const;

interface SelectedFeatureEnvelope {
  feature: GeoFeature;
  datasetSlug: string;
}

interface MapStoreState {
  activeDatasetSlugs: string[];
  layers: Record<string, ActiveLayerState>;
  selectedFeature: SelectedFeatureEnvelope | null;
  viewport: BboxTuple | null;
}

/**
 * Map UI state. The actual MapLibre Map instance lives inside MapView.vue
 * — never here — so this store only tracks serialisable application
 * state. State is intentionally session-only (no localStorage): a page
 * reload clears the active set.
 */
export const useMapStore = defineStore('map', {
  state: (): MapStoreState => ({
    activeDatasetSlugs: [],
    layers: {},
    selectedFeature: null,
    viewport: null,
  }),

  getters: {
    isActive: (state) => (slug: string) => state.activeDatasetSlugs.includes(slug),
    layerCount: (state) => state.activeDatasetSlugs.length,
    isFeatureSelected: (state) => state.selectedFeature !== null,
  },

  actions: {
    /**
     * Adds a slug to the active set if it isn't already present. Idempotent.
     * Assigns the next colour in the palette based on insertion order.
     */
    addDataset(slug: string) {
      if (!slug || this.activeDatasetSlugs.includes(slug)) return;
      this.activeDatasetSlugs.push(slug);
      this.layers[slug] = {
        slug,
        title: slug,
        bbox: null,
        features: [],
        visible: true,
        color: LAYER_COLORS[(this.activeDatasetSlugs.length - 1) % LAYER_COLORS.length],
        status: 'idle',
        errorMessage: '',
      };
    },

    /**
     * Removes a slug from the active set. Also clears the selected
     * feature if it belonged to this dataset. No-op for unknown slugs.
     */
    removeDataset(slug: string) {
      const idx = this.activeDatasetSlugs.indexOf(slug);
      if (idx === -1) return;
      this.activeDatasetSlugs.splice(idx, 1);
      delete this.layers[slug];
      if (this.selectedFeature?.datasetSlug === slug) {
        this.selectedFeature = null;
      }
    },

    /**
     * Empties the active set, all layers, and any selection.
     */
    clearAll() {
      this.activeDatasetSlugs = [];
      this.layers = {};
      this.selectedFeature = null;
    },

    /**
     * Replaces the active set with the given slugs (URL → store seed).
     * Empty array is allowed and produces a clean state.
     */
    seedFromSlugs(slugs: string[]) {
      this.activeDatasetSlugs = [];
      this.layers = {};
      this.selectedFeature = null;
      for (const slug of slugs) {
        if (!slug) continue;
        this.activeDatasetSlugs.push(slug);
        this.layers[slug] = {
          slug,
          title: slug,
          bbox: null,
          features: [],
          visible: true,
          color: LAYER_COLORS[(this.activeDatasetSlugs.length - 1) % LAYER_COLORS.length],
          status: 'idle',
          errorMessage: '',
        };
      }
    },

    /**
     * Updates the user-facing title for a layer (typically fetched from
     * the catalogue). Keeps the slug as the key.
     */
    setLayerTitle(slug: string, title: string) {
      if (!this.layers[slug]) return;
      this.layers[slug].title = title;
    },

    /**
     * Updates the stored bbox for a layer (from the catalogue summary).
     */
    setLayerBbox(slug: string, bbox: BboxTuple | null) {
      if (!this.layers[slug]) return;
      this.layers[slug].bbox = bbox;
    },

    /**
     * Stores the latest feature array for a layer. Caller is responsible
     * for stamping `datasetSlug` onto each feature.
     */
    setLayerFeatures(slug: string, features: GeoFeature[]) {
      if (!this.layers[slug]) return;
      this.layers[slug].features = features;
    },

    /**
     * Updates the loading/error status for a layer.
     */
    setLayerStatus(slug: string, status: RequestStatus, errorMessage = '') {
      if (!this.layers[slug]) return;
      this.layers[slug].status = status;
      this.layers[slug].errorMessage = errorMessage;
    },

    /**
     * Flips visibility for the named slug. No-op for unknown slugs.
     */
    toggleVisibility(slug: string) {
      if (!this.layers[slug]) return;
      this.layers[slug].visible = !this.layers[slug].visible;
    },

    /**
     * Sets visibility explicitly. No-op for unknown slugs.
     */
    setLayerVisible(slug: string, visible: boolean) {
      if (!this.layers[slug]) return;
      this.layers[slug].visible = visible;
    },

    /**
     * Records the currently selected feature along with the dataset it
     * came from, so the right panel can show its provenance.
     */
    selectFeature(feature: GeoFeature, datasetSlug: string) {
      this.selectedFeature = { feature, datasetSlug };
    },

    clearSelectedFeature() {
      this.selectedFeature = null;
    },

    setViewport(bbox: BboxTuple) {
      this.viewport = bbox;
    },
  },
});
