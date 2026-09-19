<script setup lang="ts">
import { computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import AppError from '../components/common/AppError.vue';
import AppLoading from '../components/common/AppLoading.vue';
import DatasetMetadata from '../components/datasets/DatasetMetadata.vue';
import EmptyState from '../components/common/EmptyState.vue';
import { useDatasetStore } from '../stores/dataset';
import { useMapStore } from '../stores/map';

const route = useRoute();
const router = useRouter();
const datasetStore = useDatasetStore();
const mapStore = useMapStore();

const slug = computed(() => String(route.params.slug ?? ''));

function load() {
  void datasetStore.fetchDatasetBySlug(slug.value);
}

function addToMap() {
  mapStore.addDataset(slug.value);
  void router.push({
    path: '/map',
    query: { datasets: mapStore.activeDatasetSlugs.join(',') },
  });
}

function back() {
  router.push('/datasets');
}

onMounted(load);
watch(slug, load);
</script>

<template>
  <main class="page">
    <AppLoading v-if="datasetStore.loadingStatus === 'loading'" label="Loading dataset…" />

    <AppError
      v-else-if="
        datasetStore.loadingStatus === 'error' &&
        (!datasetStore.selectedDataset || datasetStore.errorMessage.toLowerCase().includes('not found'))
      "
      title="Dataset not found"
      :message="datasetStore.errorMessage || `No dataset with slug '${slug}' exists.`"
      :show-retry="false"
    />

    <AppError
      v-else-if="datasetStore.loadingStatus === 'error'"
      title="Could not load dataset"
      :message="datasetStore.errorMessage"
      show-retry
      @retry="load"
    />

    <EmptyState
      v-else-if="!datasetStore.selectedDataset"
      title="No dataset loaded"
      message="Choose a dataset from the catalogue to see its details."
    />

    <DatasetMetadata
      v-else
      :dataset="datasetStore.selectedDataset"
      :on-map="mapStore.isActive(slug)"
      show-back
      @back="back"
      @add-to-map="addToMap"
    />
  </main>
</template>

<style scoped>
.page {
  max-width: 900px;
  margin: 0 auto;
  padding: 1.5rem 1rem 3rem;
}
</style>
