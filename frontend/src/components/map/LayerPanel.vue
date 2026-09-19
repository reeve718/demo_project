<script setup lang="ts">
import { computed } from 'vue';

import type { ActiveLayerState, BboxTuple, DatasetSummary } from '../../types';

interface Props {
  datasets: DatasetSummary[];
  layers: Record<string, ActiveLayerState>;
}
const props = defineProps<Props>();
const emit = defineEmits<{
  (e: 'toggle-visibility', slug: string): void;
  (e: 'remove', slug: string): void;
  (e: 'fit', slug: string): void;
  (e: 'fit-all'): void;
  (e: 'clear-all'): void;
}>();

const orderedLayers = computed(() => {
  // Preserve insertion order via Object.values (Pinia preserves insertion
  // order on Record state). Most recently added is at the end → top of stack.
  return Object.values(props.layers);
});

function titleFor(slug: string): string {
  return props.layers[slug]?.title || props.datasets.find((d) => d.slug === slug)?.title || slug;
}

function bboxFor(slug: string): BboxTuple | null {
  return props.layers[slug]?.bbox ?? props.datasets.find((d) => d.slug === slug)?.bbox ?? null;
}

function onToggle(slug: string) {
  emit('toggle-visibility', slug);
}

function onRemove(slug: string) {
  emit('remove', slug);
}

function onFit(slug: string) {
  emit('fit', slug);
}

const showFitAll = computed(() => orderedLayers.value.length >= 2);
</script>

<template>
  <section class="layer-panel" aria-label="Map layers">
    <header class="panel-header">
      <h3 class="panel-title">Map Layers</h3>
      <button
        v-if="orderedLayers.length > 0"
        type="button"
        class="link-danger"
        aria-label="Clear all layers"
        @click="emit('clear-all')"
      >
        Clear all
      </button>
    </header>

    <button
      v-if="showFitAll"
      type="button"
      class="fit-all"
      aria-label="Fit map to all layers"
      @click="emit('fit-all')"
    >
      ⊕ Fit to all layers
    </button>

    <ul v-if="orderedLayers.length > 0" class="layer-list">
      <li
        v-for="layer in orderedLayers"
        :key="layer.slug"
        class="layer-row"
        :class="{ 'is-hidden': !layer.visible }"
      >
        <span class="swatch" :style="{ backgroundColor: layer.color }" aria-hidden="true" />
        <div class="layer-meta">
          <span class="layer-title" :title="titleFor(layer.slug)">{{ titleFor(layer.slug) }}</span>
          <span class="layer-status">
            <template v-if="layer.status === 'loading'">Loading…</template>
            <template v-else-if="layer.status === 'error'">{{ layer.errorMessage || 'Error' }}</template>
            <template v-else-if="layer.status === 'empty'">No features in view</template>
            <template v-else>{{ layer.features.length }} feature{{ layer.features.length === 1 ? '' : 's' }}</template>
          </span>
        </div>
        <div class="layer-actions">
          <label class="vis-toggle" :aria-label="`Toggle ${titleFor(layer.slug)}`">
            <input
              type="checkbox"
              :checked="layer.visible"
              @change="onToggle(layer.slug)"
            />
          </label>
          <button
            type="button"
            class="icon-btn"
            :aria-label="`Fit to ${titleFor(layer.slug)}`"
            :disabled="!bboxFor(layer.slug)"
            @click="onFit(layer.slug)"
          >
            ⊕
          </button>
          <button
            type="button"
            class="icon-btn icon-btn-danger"
            :aria-label="`Remove ${titleFor(layer.slug)}`"
            @click="onRemove(layer.slug)"
          >
            ×
          </button>
        </div>
      </li>
    </ul>

    <p v-else class="empty">
      No layers. Add datasets from the catalogue to see them here.
    </p>
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
.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.25rem;
}
.panel-title {
  margin: 0;
  font-size: 1rem;
  color: #111827;
}
.link-danger {
  background: transparent;
  border: 0;
  cursor: pointer;
  padding: 0.3rem 0.4rem;
  border-radius: 4px;
  font-size: 0.85rem;
  color: #b91c1c;
}
.link-danger:hover {
  background: #fef2f2;
}
.fit-all {
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 0.45rem 0.6rem;
  font-size: 0.85rem;
  cursor: pointer;
  text-align: left;
  color: #374151;
  min-height: 36px;
}
.fit-all:hover {
  background: #e5e7eb;
}
.layer-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}
.layer-row {
  display: grid;
  grid-template-columns: 12px 1fr auto;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background: #f9fafb;
  border-radius: 6px;
  border: 1px solid transparent;
}
.layer-row.is-hidden {
  opacity: 0.55;
}
.swatch {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 1px solid rgba(0, 0, 0, 0.15);
  flex-shrink: 0;
}
.layer-meta {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  min-width: 0;
}
.layer-title {
  font-size: 0.92rem;
  color: #111827;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.layer-status {
  font-size: 0.75rem;
  color: #6b7280;
}
.layer-actions {
  display: flex;
  align-items: center;
  gap: 0.2rem;
}
.vis-toggle {
  display: inline-flex;
  align-items: center;
  cursor: pointer;
}
.vis-toggle input {
  width: 16px;
  height: 16px;
}
.icon-btn {
  background: transparent;
  border: 1px solid transparent;
  border-radius: 4px;
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 0.95rem;
  color: #4b5563;
}
.icon-btn:hover:not(:disabled) {
  background: #e5e7eb;
}
.icon-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.icon-btn-danger:hover {
  background: #fee2e2;
  color: #b91c1c;
}
.empty {
  margin: 0;
  padding: 0.6rem 0.5rem;
  background: #f9fafb;
  border-radius: 6px;
  font-size: 0.85rem;
  color: #6b7280;
  text-align: center;
}
</style>
