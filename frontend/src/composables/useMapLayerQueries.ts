import { ref, watch } from 'vue';
import type { Ref } from 'vue';

import { fetchFeaturesByBbox } from '../api/features';
import type { BboxQuery } from '../api/features';
import { useMapStore } from '../stores/map';
import { useAbortableRequest } from './useAbortableRequest';
import type { BboxTuple, GeoFeature } from '../types';

/**
 * Fan-out composable for the multi-dataset map.
 *
 *   - Watches the shared viewport (bbox) ref AND the active slug list.
 *   - On change, fires one GET /datasets/:slug/features?bbox=… per slug,
 *     in parallel. Each call has its own AbortController so a viewport
 *     move cancels only the request it superseded, not unrelated slugs.
 *   - On success, stamps each feature with `datasetSlug` and pushes the
 *     result into the store via `setLayerFeatures` / `setLayerStatus`.
 *
 * The composable returns nothing directly — the consumer (MapView page)
 * reads the active layer state from the store. This keeps MapView.vue
 * purely declarative.
 */
export function useMapLayerQueries(debounceMs = 250) {
  const mapStore = useMapStore();

  // One AbortableRequest instance per slug so moves cancel only their
  // own request, never another layer's in-flight query.
  const abortables = new Map<string, ReturnType<typeof useAbortableRequest>>();
  function getAbortable(slug: string): ReturnType<typeof useAbortableRequest> {
    let a = abortables.get(slug);
    if (!a) {
      a = useAbortableRequest();
      abortables.set(slug, a);
    }
    return a;
  }

  let timer: ReturnType<typeof setTimeout> | null = null;

  function stampProvenance(slug: string, features: GeoFeature[]): GeoFeature[] {
    return features.map((f) => ({ ...f, datasetSlug: slug }));
  }

  async function fetchOne(slug: string, bbox: BboxTuple) {
    const { run, isCurrent } = getAbortable(slug);
    const signal = run();
    mapStore.setLayerStatus(slug, 'loading');
    const query: BboxQuery = {
      minLon: bbox[0],
      minLat: bbox[1],
      maxLon: bbox[2],
      maxLat: bbox[3],
      limit: 200,
    };
    try {
      const fc = await fetchFeaturesByBbox(slug, query, signal);
      if (!isCurrent(signal)) return;
      mapStore.setLayerFeatures(slug, stampProvenance(slug, fc.features));
      mapStore.setLayerStatus(slug, fc.features.length === 0 ? 'empty' : 'success');
    } catch (err) {
      if ((err as { name?: string })?.name === 'CanceledError') return;
      if (!isCurrent(signal)) return;
      const message =
        (err as { error?: { message?: string } })?.error?.message ??
        (err instanceof Error ? err.message : 'Failed to load features');
      mapStore.setLayerStatus(slug, 'error', message);
    }
  }

  function scheduleForAll(bbox: BboxTuple) {
    for (const slug of mapStore.activeDatasetSlugs) {
      void fetchOne(slug, bbox);
    }
  }

  function watchBbox(bboxRef: Ref<readonly [number, number, number, number] | null>) {
    watch(
      [bboxRef, () => mapStore.activeDatasetSlugs.slice()],
      () => {
        if (!bboxRef.value) return;
        if (timer) clearTimeout(timer);
        const snapshot: BboxTuple = [
          bboxRef.value[0],
          bboxRef.value[1],
          bboxRef.value[2],
          bboxRef.value[3],
        ];
        timer = setTimeout(() => scheduleForAll(snapshot), debounceMs);
      },
      { immediate: true },
    );
  }

  return { watchBbox };
}
