<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';

import AppLoading from '../components/common/AppLoading.vue';
import DatasetList from '../components/datasets/DatasetList.vue';
import DatasetSearchBar from '../components/datasets/DatasetSearchBar.vue';
import DatasetThemeFilter from '../components/datasets/DatasetThemeFilter.vue';
import { useDatasetStore } from '../stores/dataset';

const store = useDatasetStore();

const themeList = computed(() => {
  const set = new Set<string>([...store.themes]);
  if (store.currentTheme) set.add(store.currentTheme);
  return Array.from(set).sort();
});

function refresh() {
  void store.fetchDatasets();
}

function onSearchUpdate(value: string) {
  store.setSearchKeyword(value);
  refresh();
}

function onThemeUpdate(value: string) {
  store.setTheme(value);
  refresh();
}

function changePage(delta: number) {
  const next = store.page + delta;
  if (next < 1 || next * store.pageSize > store.total) return;
  store.setPage(next);
  refresh();
}

const totalPages = computed(() => Math.max(1, Math.ceil(store.total / store.pageSize)));

onMounted(() => {
  refresh();
});

watch(
  () => store.page,
  () => {
    /* page is set via changePage, which already triggers refresh */
  },
);
</script>

<template>
  <main class="page">
    <header class="page-header">
      <h1>Spatial Dataset Explorer</h1>
      <p class="subtitle">
        Browse synthetic catalogue entries and open any dataset in the interactive map.
      </p>
    </header>

    <section class="filters" aria-label="Filters">
      <DatasetSearchBar
        :model-value="store.currentSearchKeyword"
        @update:model-value="onSearchUpdate"
      />
      <DatasetThemeFilter
        :themes="themeList"
        :model-value="store.currentTheme"
        @update:model-value="onThemeUpdate"
      />
    </section>

    <DatasetList
      :datasets="store.datasets"
      :status="store.loadingStatus"
      :error-message="store.errorMessage"
      @retry="refresh"
    />

    <nav v-if="store.total > store.pageSize" class="pagination" aria-label="Pagination">
      <button
        type="button"
        class="page-btn"
        :disabled="store.page <= 1"
        @click="changePage(-1)"
      >
        ← Previous
      </button>
      <span class="page-status">Page {{ store.page }} of {{ totalPages }}</span>
      <button
        type="button"
        class="page-btn"
        :disabled="store.page >= totalPages"
        @click="changePage(1)"
      >
        Next →
      </button>
    </nav>

    <AppLoading v-if="store.loadingStatus === 'loading' && store.datasets.length === 0" />
  </main>
</template>

<style scoped>
.page {
  max-width: 1180px;
  margin: 0 auto;
  padding: 1.5rem 1rem 3rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.page-header h1 {
  margin: 0 0 0.25rem 0;
  font-size: 1.6rem;
  color: #111827;
}
.subtitle {
  margin: 0;
  color: #4b5563;
}
.filters {
  display: grid;
  grid-template-columns: 1fr 200px;
  gap: 0.75rem;
  background: #fff;
  border: 1px solid #e5e7eb;
  padding: 0.85rem;
  border-radius: 10px;
}
@media (max-width: 640px) {
  .filters {
    grid-template-columns: 1fr;
  }
}
.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.5rem;
}
.page-btn {
  background: #fff;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  padding: 0.5rem 0.85rem;
  min-height: 40px;
  cursor: pointer;
}
.page-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
.page-status {
  font-size: 0.9rem;
  color: #4b5563;
}
</style>