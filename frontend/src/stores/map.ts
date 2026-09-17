import { defineStore } from 'pinia';

import { fetchFeaturesByBbox, BboxQuery } from '../api/features';
import type { BboxTuple, GeoFeature, RequestStatus } from '../types';

/**
 * Map UI state. The actual MapLibre Map instance lives inside MapView.vue
 * or a composable — never here — so this store only tracks serialisable
 * application state.
 */
interface MapStoreState {
  selectedDatasetSlug: string;
  selectedFeature: GeoFeature | null;
  isLayerVisible: boolean;
  featureLoadingStatus: RequestStatus;
  featureErrorMessage: string;
  currentBbox: BboxTuple | null;
  lastReturned: number;
}

export const useMapStore = defineStore('map', {
  state: (): MapStoreState => ({
    selectedDatasetSlug: '',
    selectedFeature: null,
    isLayerVisible: true,
    featureLoadingStatus: 'idle',
    featureErrorMessage: '',
    currentBbox: null,
    lastReturned: 0,
  }),

  getters: {
    isFeatureSelected: (state) => state.selectedFeature !== null,
  },

  actions: {
    selectDataset(slug: string) {
      this.selectedDatasetSlug = slug;
      this.selectedFeature = null;
      this.featureLoadingStatus = 'idle';
      this.featureErrorMessage = '';
    },

    toggleLayerVisibility() {
      this.isLayerVisible = !this.isLayerVisible;
    },

    setLayerVisible(value: boolean) {
      this.isLayerVisible = value;
    },

    selectFeature(feature: GeoFeature | null) {
      this.selectedFeature = feature;
    },

    clearSelectedFeature() {
      this.selectedFeature = null;
    },

    setCurrentBbox(bbox: BboxTuple) {
      this.currentBbox = bbox;
    },

    /**
     * Fetches features for the selected dataset inside the bbox. Pass an
     * AbortSignal to cancel an in-flight request when a newer one starts.
     */
    async fetchFeaturesByBbox(query: BboxQuery, signal?: AbortSignal) {
      if (!this.selectedDatasetSlug) return;
      this.featureLoadingStatus = 'loading';
      this.featureErrorMessage = '';
      try {
        const fc = await fetchFeaturesByBbox(this.selectedDatasetSlug, query, signal);
        this.lastReturned = fc.features.length;
        this.featureLoadingStatus = fc.features.length === 0 ? 'empty' : 'success';
        // Note: the actual feature array is consumed by MapView.vue. We only
        // publish the count + status here. The MapView composable calls the
        // API directly when it needs the latest feature array.
      } catch (err) {
        if ((err as { name?: string })?.name === 'CanceledError') {
          // A newer request took over; stay in current state.
          return;
        }
        this.featureLoadingStatus = 'error';
        this.featureErrorMessage =
          (err as { error?: { message?: string } })?.error?.message ??
          (err instanceof Error ? err.message : 'Failed to load features');
      }
    },
  },
});