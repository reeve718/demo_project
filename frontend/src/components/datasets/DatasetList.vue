<script setup lang="ts">
import DatasetCard from './DatasetCard.vue';
import AppLoading from '../common/AppLoading.vue';
import AppError from '../common/AppError.vue';
import EmptyState from '../common/EmptyState.vue';
import type { DatasetSummary, RequestStatus } from '../../types';

interface Props {
  datasets: DatasetSummary[];
  status: RequestStatus;
  errorMessage?: string;
}
const props = withDefaults(defineProps<Props>(), { errorMessage: '' });

defineEmits<{ (e: 'retry'): void }>();
</script>

<template>
  <section class="dataset-list" aria-live="polite">
    <AppLoading v-if="props.status === 'loading'" label="Loading datasets…" />

    <AppError
      v-else-if="props.status === 'error'"
      title="Could not load datasets"
      :message="props.errorMessage || 'Please check your network and try again.'"
      @retry="$emit('retry')"
    />

    <EmptyState
      v-else-if="props.status === 'empty'"
      title="No datasets match your filters"
      message="Try clearing the search keyword or selecting a different theme."
    />

    <div v-else class="grid">
      <DatasetCard
        v-for="d in props.datasets"
        :key="d.id"
        :dataset="d"
      />
    </div>
  </section>
</template>

<style scoped>
.dataset-list {
  display: block;
}
.grid {
  display: grid;
  gap: 0.85rem;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
}
</style>