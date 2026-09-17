import { setActivePinia, createPinia } from 'pinia';

import { listDatasets } from '../src/api/datasets';
import { useDatasetStore } from '../src/stores/dataset';

vi.mock('../src/api/datasets', () => ({
  listDatasets: vi.fn(),
  getDatasetBySlug: vi.fn(),
}));

const mockedList = listDatasets as unknown as ReturnType<typeof vi.fn>;

describe('datasetStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('handles empty results by transitioning to "empty"', async () => {
    mockedList.mockResolvedValue({
      items: [],
      meta: { page: 1, pageSize: 10, total: 0 },
    });

    const store = useDatasetStore();
    await store.fetchDatasets();

    expect(store.loadingStatus).toBe('empty');
    expect(store.datasets).toEqual([]);
    expect(store.total).toBe(0);
  });

  it('handles API errors by transitioning to "error"', async () => {
    mockedList.mockRejectedValue({
      error: { code: 'NETWORK_ERROR', message: 'boom' },
    });

    const store = useDatasetStore();
    await store.fetchDatasets();

    expect(store.loadingStatus).toBe('error');
    expect(store.errorMessage).toBe('boom');
  });

  it('updates loading state during fetch', async () => {
    let resolveFn: (v: unknown) => void = () => undefined;
    mockedList.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveFn = resolve;
        }),
    );

    const store = useDatasetStore();
    const promise = store.fetchDatasets();
    expect(store.loadingStatus).toBe('loading');
    resolveFn({ items: [], meta: { page: 1, pageSize: 10, total: 0 } });
    await promise;
    expect(store.loadingStatus).toBe('empty');
  });

  it('resetFilters clears search keyword and theme', () => {
    const store = useDatasetStore();
    store.setSearchKeyword('flood');
    store.setTheme('Environment');
    store.resetFilters();
    expect(store.currentSearchKeyword).toBe('');
    expect(store.currentTheme).toBe('');
  });
});