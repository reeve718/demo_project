<script setup lang="ts">
import type { DatasetDetail } from '../../types';

interface Props {
  datasets: DatasetDetail[];
  selectedSlug: string;
}
defineProps<Props>();
defineEmits<{ (e: 'select', slug: string): void }>();
</script>

<template>
  <div class="selector">
    <label class="selector-label" for="dataset-selector">Active dataset</label>
    <select
      id="dataset-selector"
      class="selector-input"
      :value="selectedSlug"
      @change="(e) => $emit('select', (e.target as HTMLSelectElement).value)"
    >
      <option value="" disabled>Choose a dataset…</option>
      <option v-for="d in datasets" :key="d.slug" :value="d.slug">{{ d.title }}</option>
    </select>
  </div>
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
</style>