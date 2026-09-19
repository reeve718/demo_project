import { ref, nextTick } from 'vue';
import { setActivePinia, createPinia } from 'pinia';

import { fetchFeaturesByBbox } from '../../src/api/features';
import { useMapStore } from '../../src/stores/map';
import { useMapLayerQueries } from '../../src/composables/useMapLayerQueries';

vi.mock('../../src/api/features', () => ({
  fetchFeaturesByBbox: vi.fn(),
}));

const mockedFetch = fetchFeaturesByBbox as unknown as ReturnType<typeof vi.fn>;

function envelope(slug: string, ids: string[]) {
  return {
    type: 'FeatureCollection' as const,
    features: ids.map((id) => ({
      type: 'Feature' as const,
      id,
      geometry: { type: 'Point' as const, coordinates: [114.1, 22.2] },
      properties: { name: `Feature ${id}` },
      datasetSlug: slug,
    })),
    meta: {
      requestId: 'req-1',
      datasetSlug: slug,
      bbox: [114.0, 22.2, 114.4, 22.5] as [number, number, number, number],
      returned: ids.length,
      limit: 200,
    },
  };
}

describe('useMapLayerQueries', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('fires one request per active slug when the bbox changes', async () => {
    const store = useMapStore();
    store.addDataset('a');
    store.addDataset('b');

    mockedFetch.mockImplementation((slug: string) =>
      Promise.resolve(envelope(slug, slug === 'a' ? ['1'] : ['2'])),
    );

    const { watchBbox } = useMapLayerQueries(0);
    const bbox = ref<[number, number, number, number] | null>([114.0, 22.2, 114.4, 22.5]);
    watchBbox(bbox);
    await nextTick();
    // debounceMs = 0 → setTimeout still queues a tick; let it run.
    await new Promise((r) => setTimeout(r, 5));
    await Promise.resolve();

    expect(mockedFetch).toHaveBeenCalledTimes(2);
    expect(mockedFetch.mock.calls.map((c) => c[0]).sort()).toEqual(['a', 'b']);
    expect(store.layers.a.features.map((f) => f.id)).toEqual(['1']);
    expect(store.layers.b.features.map((f) => f.id)).toEqual(['2']);
    expect(store.layers.a.status).toBe('success');
    expect(store.layers.b.status).toBe('success');
  });

  it('sets status to loading immediately for each slug', async () => {
    const store = useMapStore();
    store.addDataset('a');
    let resolveFn: (v: unknown) => void = () => undefined;
    mockedFetch.mockImplementation(
      () => new Promise((resolve) => { resolveFn = resolve; }),
    );

    const { watchBbox } = useMapLayerQueries(0);
    const bbox = ref<[number, number, number, number] | null>([114.0, 22.2, 114.4, 22.5]);
    watchBbox(bbox);
    await new Promise((r) => setTimeout(r, 5));
    expect(store.layers.a.status).toBe('loading');

    resolveFn(envelope('a', ['1']));
    // Drain microtasks: await Promise.resolve() only flushes one tick;
    // we need to let the fetchOne continuation run.
    await new Promise((r) => setTimeout(r, 5));
    expect(store.layers.a.status).toBe('success');
  });

  it('cancels in-flight requests when a new bbox arrives', async () => {
    const store = useMapStore();
    store.addDataset('a');

    let firstResolve: (v: unknown) => void = () => undefined;
    let secondResolve: (v: unknown) => void = () => undefined;
    let call = 0;
    mockedFetch.mockImplementation(() => {
      call += 1;
      return new Promise((resolve) => {
        if (call === 1) firstResolve = resolve;
        else secondResolve = resolve;
      });
    });

    const { watchBbox } = useMapLayerQueries(0);
    const bbox = ref<[number, number, number, number] | null>([114.0, 22.2, 114.4, 22.5]);
    watchBbox(bbox);
    await new Promise((r) => setTimeout(r, 5));

    // Move the viewport — the first request should be aborted.
    bbox.value = [114.05, 22.25, 114.45, 22.55];
    await new Promise((r) => setTimeout(r, 5));

    // Resolve the (cancelled) first request — must not affect store.
    firstResolve(envelope('a', ['should-not-apply']));
    await new Promise((r) => setTimeout(r, 5));
    expect(store.layers.a.features).toHaveLength(0);

    // Resolve the second request with the real features.
    secondResolve(envelope('a', ['real']));
    await new Promise((r) => setTimeout(r, 5));
    expect(store.layers.a.features.map((f) => f.id)).toEqual(['real']);
  });

  it('records errors on the affected slug without affecting others', async () => {
    const store = useMapStore();
    store.addDataset('a');
    store.addDataset('b');

    mockedFetch.mockImplementation((slug: string) => {
      if (slug === 'a') {
        return Promise.reject({ error: { code: 'NETWORK_ERROR', message: 'boom' } });
      }
      return Promise.resolve(envelope('b', ['1']));
    });

    const { watchBbox } = useMapLayerQueries(0);
    const bbox = ref<[number, number, number, number] | null>([114.0, 22.2, 114.4, 22.5]);
    watchBbox(bbox);
    await new Promise((r) => setTimeout(r, 5));
    await Promise.resolve();
    await Promise.resolve();

    expect(store.layers.a.status).toBe('error');
    expect(store.layers.a.errorMessage).toBe('boom');
    expect(store.layers.b.status).toBe('success');
  });

  it('sets status to empty when the response has zero features', async () => {
    const store = useMapStore();
    store.addDataset('a');
    mockedFetch.mockResolvedValue(envelope('a', []));

    const { watchBbox } = useMapLayerQueries(0);
    const bbox = ref<[number, number, number, number] | null>([114.0, 22.2, 114.4, 22.5]);
    watchBbox(bbox);
    await new Promise((r) => setTimeout(r, 5));
    await Promise.resolve();

    expect(store.layers.a.status).toBe('empty');
    expect(store.layers.a.features).toEqual([]);
  });
});
