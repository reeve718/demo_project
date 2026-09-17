<script setup lang="ts">
import { computed } from 'vue';

import type { DatasetDetail } from '../../types';

interface Props {
  datasets: DatasetDetail[];
  selectedSlug: string;
  layerVisible: boolean;
}
const props = defineProps<Props>();
const emit = defineEmits<{
  (e: 'select', slug: string): void;
  (e: 'toggle-visibility'): void;
}>();

const selected = computed(() =>
  props.datasets.find((d) => d.slug === props.selectedSlug) ?? null,
);

function onSelect(event: Event) {
  emit('select', (event.target as HTMLSelectElement).value);
}
</script>

<template>
  <section class="layer-panel" aria-label="Map layers">
    <h3 class="panel-title">Map Layers</h3>

    <label class="panel-label" for="layer-dataset">Dataset</label>
    <select
      id="layer-dataset"
      class="panel-select"
      :value="props.selectedSlug"
      @change="onSelect"
    >
      <option value="" disabled>Select a dataset…</option>
      <option v-for="d in props.datasets" :key="d.slug" :value="d.slug">
        {{ d.title }}
      </option>
    </select>

    <label class="visibility-toggle">
      <input
        type="checkbox"
        :checked="props.layerVisible"
        @change="$emit('toggle-visibility')"
      />
      <span>Show layer</span>
    </label>

    <div v-if="selected" class="summary">
      <h4>{{ selected.title }}</h4>
      <p class="summary-theme">{{ selected.theme }} · {{ selected.publisher }}</p>
      <p class="summary-description">{{ selected.description }}</p>
      <ul v-if="selected.tags?.length" class="summary-tags">
        <li v-for="t in selected.tags" :key="t">{{ t }}</li>
      </ul>
    </div>
  </section>
</template>

<style scoped>
.layer-panel {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1rem;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
}
.panel-title {
  margin: 0 0 0.25rem 0;
  font-size: 1rem;
  color: #111827;
}
.panel-label {
  font-size: 0.78rem;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.panel-select {
  padding: 0.55rem 0.7rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: #fff;
  font-size: 1rem;
  min-height: 40px;
}
.panel-select:focus-visible {
  outline: 2px solid #1d4ed8;
  outline-offset: 1px;
}
.visibility-toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.95rem;
  cursor: pointer;
  padding: 0.35rem 0;
}
.visibility-toggle input {
  width: 18px;
  height: 18px;
}
.summary {
  margin-top: 0.5rem;
  border-top: 1px solid #f3f4f6;
  padding-top: 0.6rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}
.summary h4 {
  margin: 0;
  font-size: 0.95rem;
  color: #111827;
}
.summary-theme,
.summary-description {
  margin: 0;
  font-size: 0.85rem;
  color: #4b5563;
  line-height: 1.4;
}
.summary-tags {
  list-style: none;
  padding: 0;
  margin: 0.25rem 0 0;
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
}
.summary-tags li {
  padding: 0.1rem 0.45rem;
  background: #f3f4f6;
  border-radius: 4px;
  font-size: 0.78rem;
  color: #374151;
}
</style>