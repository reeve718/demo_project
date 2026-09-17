import { defineStore } from 'pinia';

import { getDatasetBySlug, listDatasets, ListDatasetsParams } from '../api/datasets';
import type { DatasetDetail, DatasetSummary, RequestStatus } from '../types';

interface DatasetStoreState {
  datasets: DatasetSummary[];
  total: number;
  selectedDataset: DatasetDetail | null;
  currentSearchKeyword: string;
  currentTheme: string;
  loadingStatus: RequestStatus;
  errorMessage: string;
  page: number;
  pageSize: number;
}

/**
 * Catalogue state. Pinia holds only application state — no MapLibre
 * objects, no request promises — so the store is fully serialisable.
 */
export const useDatasetStore = defineStore('dataset', {
  state: (): DatasetStoreState => ({
    datasets: [],
    total: 0,
    selectedDataset: null,
    currentSearchKeyword: '',
    currentTheme: '',
    loadingStatus: 'idle',
    errorMessage: '',
    page: 1,
    pageSize: 10,
  }),

  getters: {
    hasResults: (state) => state.datasets.length > 0,
    themes: (state) => {
      const set = new Set<string>();
      for (const d of state.datasets) set.add(d.theme);
      return Array.from(set).sort();
    },
  },

  actions: {
    setSearchKeyword(keyword: string) {
      this.currentSearchKeyword = keyword;
      this.page = 1;
    },

    setTheme(theme: string) {
      this.currentTheme = theme;
      this.page = 1;
    },

    setPage(page: number) {
      this.page = Math.max(1, page);
    },

    resetFilters() {
      this.currentSearchKeyword = '';
      this.currentTheme = '';
      this.page = 1;
    },

    async fetchDatasets(extra: Partial<ListDatasetsParams> = {}) {
      this.loadingStatus = 'loading';
      this.errorMessage = '';
      try {
        const params: ListDatasetsParams = {
          q: this.currentSearchKeyword || undefined,
          theme: this.currentTheme || undefined,
          page: this.page,
          pageSize: this.pageSize,
          ...extra,
        };
        const result = await listDatasets(params);
        this.datasets = result.items;
        this.total = result.meta.total;
        this.loadingStatus = result.items.length === 0 ? 'empty' : 'success';
      } catch (err) {
        this.loadingStatus = 'error';
        this.errorMessage =
          (err as { error?: { message?: string } })?.error?.message ??
          (err instanceof Error ? err.message : 'Failed to load datasets');
      }
    },

    async fetchDatasetBySlug(slug: string) {
      this.loadingStatus = 'loading';
      this.errorMessage = '';
      this.selectedDataset = null;
      try {
        const data = await getDatasetBySlug(slug);
        this.selectedDataset = data;
        this.loadingStatus = 'success';
      } catch (err) {
        this.loadingStatus = 'error';
        this.errorMessage =
          (err as { error?: { message?: string } })?.error?.message ??
          (err instanceof Error ? err.message : 'Failed to load dataset');
      }
    },
  },
});