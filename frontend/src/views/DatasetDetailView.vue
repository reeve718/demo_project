<script setup lang="ts">
import { computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import AppError from '../components/common/AppError.vue';
import AppLoading from '../components/common/AppLoading.vue';
import DatasetMetadata from '../components/datasets/DatasetMetadata.vue';
import EmptyState from '../components/common/EmptyState.vue';
import { useDatasetStore } from '../stores/dataset';

const route = useRoute();
const router = useRouter();
const store = useDatasetStore();

const slug = computed(() => String(route.params.slug ?? ''));

function load() {
  void store.fetchDatasetBySlug(slug.value);
}

function openInMap() {
  router.push({ path: '/map', query: { dataset: slug.value } });
}

function back() {
  router.push('/datasets');
}

onMounted(load);
watch(slug, load);
</script>

<template>
  <main class="page">
    <AppLoading v-if="store.loadingStatus === 'loading'" label="Loading dataset…" />

    <AppError
      v-else-if="
        store.loadingStatus === 'error' &&
        (!store.selectedDataset || store.errorMessage.toLowerCase().includes('not found'))
      "
      title="Dataset not found"
      :message="store.errorMessage || `No dataset with slug '${slug}' exists.`"
      :show-retry="false"
    />

    <AppError
      v-else-if="store.loadingStatus === 'error'"
      title="Could not load dataset"
      :message="store.errorMessage"
      show-retry
      @retry="load"
    />

    <EmptyState
      v-else-if="!store.selectedDataset"
      title="No dataset loaded"
      message="Choose a dataset from the catalogue to see its details."
    />

    <DatasetMetadata
      v-else
      :dataset="store.selectedDataset"
      show-back
      @back="back"
      @open-in-map="openInMap"
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