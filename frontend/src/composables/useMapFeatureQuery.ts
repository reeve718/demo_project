import { ref, watch } from 'vue';
import type { Ref } from 'vue';

import { fetchFeaturesByBbox, BboxQuery } from '../api/features';
import { useMapStore } from '../stores/map';
import type { GeoFeature } from '../types';
import { useAbortableRequest } from './useAbortableRequest';

/**
 * Wires a bbox ref into the features API:
 *   - debounces moves by `debounceMs`
 *   - aborts previous requests when a newer bbox arrives
 *   - exposes the resulting features and the latest request id so the
 *     caller (MapView.vue) can paint the source layer
 */
export function useMapFeatureQuery(debounceMs = 250) {
  const mapStore = useMapStore();
  const { run, isCurrent } = useAbortableRequest();

  const features = ref<GeoFeature[]>([]);
  const lastRequestId = ref<string>('');

  let timer: ReturnType<typeof setTimeout> | null = null;

  function scheduleQuery(bboxRef: Ref<readonly [number, number, number, number] | null>) {
    if (!mapStore.selectedDatasetSlug) return;
    if (!bboxRef.value) return;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      const signal = run();
      void execute(bboxRef.value as [number, number, number, number], signal);
    }, debounceMs);
  }

  async function execute(bbox: [number, number, number, number], signal: AbortSignal) {
    if (!mapStore.selectedDatasetSlug) return;
    mapStore.featureLoadingStatus = 'loading';
    mapStore.featureErrorMessage = '';
    const query: BboxQuery = {
      minLon: bbox[0],
      minLat: bbox[1],
      maxLon: bbox[2],
      maxLat: bbox[3],
      limit: 200,
    };
    try {
      const fc = await fetchFeaturesByBbox(mapStore.selectedDatasetSlug, query, signal);
      if (!isCurrent(signal)) return;
      features.value = fc.features;
      lastRequestId.value = fc.meta?.requestId ?? '';
      mapStore.featureLoadingStatus = fc.features.length === 0 ? 'empty' : 'success';
    } catch (err) {
      if ((err as { name?: string })?.name === 'CanceledError') return;
      if (!isCurrent(signal)) return;
      mapStore.featureLoadingStatus = 'error';
      mapStore.featureErrorMessage =
        (err as { error?: { message?: string } })?.error?.message ??
        (err instanceof Error ? err.message : 'Failed to load features');
    }
  }

  /**
   * Sets up a watcher so any new bbox value triggers a fresh query.
   * Returns the reactive features ref for the map source layer.
   */
  function watchBbox(bboxRef: Ref<readonly [number, number, number, number] | null>) {
    watch(
      bboxRef,
      () => scheduleQuery(bboxRef),
      { immediate: true },
    );
  }

  return { features, lastRequestId, watchBbox, scheduleQuery };
}