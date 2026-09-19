<script setup lang="ts">
import { computed } from 'vue';

import type { GeoFeature } from '../../types';

interface Props {
  feature: GeoFeature | null;
  datasetTitle?: string;
}
const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'zoom'): void;
  (e: 'close'): void;
}>();

const properties = computed(() => {
  if (!props.feature) return [] as Array<{ key: string; value: string }>;
  return Object.entries(props.feature.properties ?? {})
    .filter(([key]) => !key.startsWith('_'))
    .map(([key, value]) => ({ key, value: formatValue(value) }));
});

const geometryType = computed(() => props.feature?.geometry?.type ?? '');

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  try {
    return JSON.stringify(value);
  } catch {
    return '[unserialisable]';
  }
}
</script>

<template>
  <aside class="feature-details" aria-label="Feature details">
    <header class="feature-header">
      <h3>{{ props.feature?.properties?.name || 'Selected feature' }}</h3>
      <button
        type="button"
        class="close-btn"
        aria-label="Close feature details"
        @click="emit('close')"
      >
        ×
      </button>
    </header>

    <p v-if="props.datasetTitle" class="layer-tag">{{ props.datasetTitle }}</p>
    <p v-else-if="geometryType" class="geom">{{ geometryType }}</p>

    <p v-if="properties.length === 0" class="empty">No attributes available.</p>

    <ul v-else class="prop-list">
      <li v-for="p in properties" :key="p.key" class="prop-row">
        <span class="prop-key">{{ p.key }}</span>
        <span class="prop-value">{{ p.value }}</span>
      </li>
    </ul>

    <button v-if="props.feature" type="button" class="zoom-btn" @click="emit('zoom')">
      Zoom to feature
    </button>
  </aside>
</template>

<style scoped>
.feature-details {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1rem;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  height: 100%;
  overflow: auto;
}
.feature-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
}
.feature-header h3 {
  margin: 0;
  font-size: 1rem;
  color: #111827;
  word-break: break-word;
}
.close-btn {
  background: transparent;
  border: 0;
  width: 32px;
  height: 32px;
  font-size: 1.2rem;
  border-radius: 6px;
  cursor: pointer;
  color: #6b7280;
}
.close-btn:hover {
  background: #f3f4f6;
  color: #111827;
}
.geom {
  margin: 0;
  font-size: 0.78rem;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.layer-tag {
  display: inline-block;
  margin: 0;
  padding: 0.15rem 0.5rem;
  background: #eff6ff;
  color: #1d4ed8;
  font-size: 0.78rem;
  border-radius: 4px;
  font-weight: 500;
  align-self: flex-start;
}
.empty {
  margin: 0;
  color: #6b7280;
  font-size: 0.9rem;
}
.prop-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
.prop-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 0.5rem;
  padding: 0.4rem 0.5rem;
  background: #f9fafb;
  border-radius: 6px;
  font-size: 0.9rem;
}
.prop-key {
  font-weight: 600;
  color: #374151;
  word-break: break-word;
}
.prop-value {
  color: #111827;
  text-align: right;
  word-break: break-word;
}
.zoom-btn {
  background: #1d4ed8;
  color: #fff;
  border: 0;
  padding: 0.55rem 0.85rem;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  margin-top: 0.5rem;
  min-height: 40px;
}
.zoom-btn:hover {
  background: #1e40af;
}
</style>