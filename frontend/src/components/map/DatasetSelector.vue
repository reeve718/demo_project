<script setup lang="ts">
import { computed } from 'vue';

import type { DatasetSummary } from '../../types';

interface Props {
  datasets: DatasetSummary[];
  excludeSlugs: string[];
}
const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'add', slug: string): void;
}>();

const candidates = computed(() =>
  props.datasets.filter((d) => !props.excludeSlugs.includes(d.slug)),
);

function onChange(event: Event) {
  const value = (event.target as HTMLSelectElement).value;
  if (!value) return;
  emit('add', value);
  // Reset to the placeholder so the same dataset can be re-selected later.
  (event.target as HTMLSelectElement).value = '';
}
</script>

<template>
  <div v-if="candidates.length > 0" class="selector">
    <label class="selector-label" for="dataset-selector">Add a layer</label>
    <select
      id="dataset-selector"
      class="selector-input"
      :value="''"
      @change="onChange"
    >
      <option value="" disabled>Choose a dataset to add…</option>
      <option v-for="d in candidates" :key="d.slug" :value="d.slug">
        {{ d.title }}
      </option>
    </select>
  </div>
  <p v-else class="selector-empty">
    All available datasets are already on the map.
  </p>
</template>

<style scoped>
.selector {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}
.selector-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.selector-input {
  padding: 0.55rem 0.7rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: #fff;
  font-size: 1rem;
  min-height: 40px;
}
.selector-empty {
  margin: 0;
  padding: 0.5rem 0.6rem;
  font-size: 0.85rem;
  color: #6b7280;
  background: #f9fafb;
  border-radius: 6px;
  text-align: center;
}
</style>
