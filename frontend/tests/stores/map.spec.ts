import { setActivePinia, createPinia } from 'pinia';

import { useMapStore } from '../../src/stores/map';
import type { GeoFeature } from '../../src/types';

function makeFeature(id: string, datasetSlug = 'foo'): GeoFeature {
  return {
    type: 'Feature',
    id,
    geometry: { type: 'Point', coordinates: [114.1, 22.2] },
    properties: { name: `Feature ${id}` },
    datasetSlug,
  };
}

describe('mapStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  describe('addDataset', () => {
    it('adds a slug with default visible state and a stable colour', () => {
      const store = useMapStore();
      store.addDataset('hk-fire-stations');
      expect(store.activeDatasetSlugs).toEqual(['hk-fire-stations']);
      expect(store.isActive('hk-fire-stations')).toBe(true);
      const layer = store.layers['hk-fire-stations'];
      expect(layer).toBeDefined();
      expect(layer.visible).toBe(true);
      expect(layer.status).toBe('idle');
      expect(layer.features).toEqual([]);
      expect(layer.color).toMatch(/^#[0-9a-f]{6}$/i);
    });

    it('is idempotent — adding the same slug twice does not duplicate it', () => {
      const store = useMapStore();
      store.addDataset('hk-fire-stations');
      store.addDataset('hk-fire-stations');
      expect(store.activeDatasetSlugs).toEqual(['hk-fire-stations']);
      expect(store.layerCount).toBe(1);
    });

    it('appends new slugs after existing ones (most recent last)', () => {
      const store = useMapStore();
      store.addDataset('hk-fire-stations');
      store.addDataset('hk-ambulance-depots');
      expect(store.activeDatasetSlugs).toEqual([
        'hk-fire-stations',
        'hk-ambulance-depots',
      ]);
    });

    it('cycles through the colour palette by insertion order', () => {
      const store = useMapStore();
      const slugs = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i'];
      slugs.forEach((s) => store.addDataset(s));
      expect(store.layers.a.color).not.toBe(store.layers.b.color);
      // After 8 additions, colour should wrap and reuse the first colour.
      expect(store.layers.i.color).toBe(store.layers.a.color);
    });
  });

  describe('removeDataset', () => {
    it('removes the slug from the active set and layers map', () => {
      const store = useMapStore();
      store.addDataset('hk-fire-stations');
      store.addDataset('hk-ambulance-depots');
      store.removeDataset('hk-fire-stations');
      expect(store.activeDatasetSlugs).toEqual(['hk-ambulance-depots']);
      expect(store.layers['hk-fire-stations']).toBeUndefined();
    });

    it('clears the selected feature when it belongs to the removed dataset', () => {
      const store = useMapStore();
      store.addDataset('hk-fire-stations');
      store.selectFeature(makeFeature('1', 'hk-fire-stations'), 'hk-fire-stations');
      expect(store.selectedFeature).not.toBeNull();
      store.removeDataset('hk-fire-stations');
      expect(store.selectedFeature).toBeNull();
    });

    it('preserves the selected feature when it belongs to a different dataset', () => {
      const store = useMapStore();
      store.addDataset('hk-fire-stations');
      store.addDataset('hk-ambulance-depots');
      store.selectFeature(makeFeature('1', 'hk-ambulance-depots'), 'hk-ambulance-depots');
      store.removeDataset('hk-fire-stations');
      expect(store.selectedFeature?.datasetSlug).toBe('hk-ambulance-depots');
    });

    it('is a no-op when removing a slug that is not active', () => {
      const store = useMapStore();
      store.addDataset('hk-fire-stations');
      store.removeDataset('not-on-map');
      expect(store.activeDatasetSlugs).toEqual(['hk-fire-stations']);
    });
  });

  describe('clearAll', () => {
    it('empties the active set, layers, and selected feature', () => {
      const store = useMapStore();
      store.addDataset('hk-fire-stations');
      store.addDataset('hk-ambulance-depots');
      store.selectFeature(makeFeature('1'), 'hk-fire-stations');
      store.clearAll();
      expect(store.activeDatasetSlugs).toEqual([]);
      expect(store.layers).toEqual({});
      expect(store.selectedFeature).toBeNull();
      expect(store.layerCount).toBe(0);
    });
  });

  describe('toggleVisibility / setLayerVisible', () => {
    it('toggles visibility for the named slug', () => {
      const store = useMapStore();
      store.addDataset('hk-fire-stations');
      expect(store.layers['hk-fire-stations'].visible).toBe(true);
      store.toggleVisibility('hk-fire-stations');
      expect(store.layers['hk-fire-stations'].visible).toBe(false);
      store.toggleVisibility('hk-fire-stations');
      expect(store.layers['hk-fire-stations'].visible).toBe(true);
    });

    it('is a no-op for unknown slugs', () => {
      const store = useMapStore();
      expect(() => store.toggleVisibility('not-on-map')).not.toThrow();
    });
  });

  describe('seedFromSlugs', () => {
    it('replaces the active set with the given slugs', () => {
      const store = useMapStore();
      store.addDataset('old');
      store.seedFromSlugs(['hk-fire-stations', 'hk-ambulance-depots']);
      expect(store.activeDatasetSlugs).toEqual([
        'hk-fire-stations',
        'hk-ambulance-depots',
      ]);
      expect(store.layers.old).toBeUndefined();
    });

    it('with an empty array produces no active layers', () => {
      const store = useMapStore();
      store.addDataset('hk-fire-stations');
      store.seedFromSlugs([]);
      expect(store.activeDatasetSlugs).toEqual([]);
      expect(store.layerCount).toBe(0);
    });

    it('preserves insertion order from the seed list', () => {
      const store = useMapStore();
      store.seedFromSlugs(['z', 'a', 'm']);
      expect(store.activeDatasetSlugs).toEqual(['z', 'a', 'm']);
    });
  });

  describe('setLayerFeatures / setLayerStatus', () => {
    it('stores features for the named slug', () => {
      const store = useMapStore();
      store.addDataset('hk-fire-stations');
      const features = [makeFeature('1'), makeFeature('2')];
      store.setLayerFeatures('hk-fire-stations', features);
      expect(store.layers['hk-fire-stations'].features).toHaveLength(2);
    });

    it('updates status and error message for the named slug', () => {
      const store = useMapStore();
      store.addDataset('hk-fire-stations');
      store.setLayerStatus('hk-fire-stations', 'error', 'Network error');
      expect(store.layers['hk-fire-stations'].status).toBe('error');
      expect(store.layers['hk-fire-stations'].errorMessage).toBe('Network error');
    });
  });

  describe('selected feature', () => {
    it('stores the feature with its dataset provenance', () => {
      const store = useMapStore();
      const f = makeFeature('1', 'hk-fire-stations');
      store.selectFeature(f, 'hk-fire-stations');
      expect(store.selectedFeature).toEqual({
        feature: f,
        datasetSlug: 'hk-fire-stations',
      });
    });

    it('clearSelectedFeature resets to null', () => {
      const store = useMapStore();
      store.selectFeature(makeFeature('1'), 'hk-fire-stations');
      store.clearSelectedFeature();
      expect(store.selectedFeature).toBeNull();
    });
  });

  describe('viewport', () => {
    it('round-trips through setViewport', () => {
      const store = useMapStore();
      const bbox: [number, number, number, number] = [114.0, 22.2, 114.4, 22.5];
      store.setViewport(bbox);
      expect(store.viewport).toEqual(bbox);
    });
  });
});
