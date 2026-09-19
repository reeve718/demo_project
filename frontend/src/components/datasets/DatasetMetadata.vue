<script setup lang="ts">
import { computed } from 'vue';

import type { DatasetDetail } from '../../types';

interface Props {
  dataset: DatasetDetail;
  showBack?: boolean;
  onMap?: boolean;
}
const props = withDefaults(defineProps<Props>(), { showBack: false, onMap: false });

defineEmits<{ (e: 'back'): void; (e: 'add-to-map'): void }>();

const updatedDate = computed(() => {
  if (!props.dataset.updatedAt) return '';
  try {
    return new Date(props.dataset.updatedAt).toLocaleDateString();
  } catch {
    return props.dataset.updatedAt;
  }
});

const bboxText = computed(() => {
  const b = props.dataset.bbox;
  if (!b) return '';
  return `${b[0].toFixed(3)}, ${b[1].toFixed(3)} → ${b[2].toFixed(3)}, ${b[3].toFixed(3)}`;
});
</script>

<template>
  <article class="meta">
    <header class="meta-header">
      <div>
        <h2 class="meta-title">{{ props.dataset.title }}</h2>
        <p class="meta-theme">{{ props.dataset.theme }} · {{ props.dataset.publisher }}</p>
      </div>
      <div class="meta-actions">
        <button v-if="props.showBack" type="button" class="link" @click="$emit('back')">
          ← Back
        </button>
      </div>
    </header>

    <p class="meta-description">{{ props.dataset.description }}</p>

    <dl class="meta-grid">
      <div class="meta-row">
        <dt>License</dt>
        <dd>{{ props.dataset.license }}</dd>
      </div>
      <div class="meta-row">
        <dt>Updated</dt>
        <dd>{{ updatedDate }}</dd>
      </div>
      <div class="meta-row">
        <dt>Spatial extent</dt>
        <dd>{{ bboxText }}</dd>
      </div>
      <div class="meta-row">
        <dt>Tags</dt>
        <dd>
          <span v-for="t in props.dataset.tags" :key="t" class="tag">{{ t }}</span>
          <span v-if="props.dataset.tags.length === 0" class="muted">None</span>
        </dd>
      </div>
    </dl>

    <section v-if="props.dataset.fields?.length" class="fields">
      <h3 class="fields-title">Attribute schema</h3>
      <ul class="field-list">
        <li v-for="f in props.dataset.fields" :key="f.name" class="field">
          <span class="field-name">{{ f.alias || f.name }}</span>
          <span class="field-type">{{ f.type }}<span v-if="f.nullable"> · nullable</span></span>
        </li>
      </ul>
    </section>

    <footer class="meta-footer">
      <button class="primary" type="button" @click="$emit('add-to-map')">
        <span class="btn-icon" aria-hidden="true">＋</span>
        <span>Add to Map</span>
        <span v-if="props.onMap" class="on-map-badge">On map ✓</span>
      </button>
    </footer>
  </article>
</template>

<style scoped>
.meta {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
}
.meta-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}
.meta-title {
  margin: 0;
  font-size: 1.4rem;
  color: #111827;
}
.meta-theme {
  margin: 0.25rem 0 0;
  color: #6b7280;
  font-size: 0.9rem;
}
.meta-description {
  margin: 0;
  color: #374151;
  line-height: 1.5;
}
.meta-grid {
  margin: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 0.6rem 1rem;
}
.meta-row {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}
.meta-row dt {
  font-size: 0.78rem;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}
.meta-row dd {
  margin: 0;
  color: #111827;
  font-size: 0.95rem;
}
.tag {
  display: inline-block;
  padding: 0.15rem 0.5rem;
  margin: 0 0.25rem 0.25rem 0;
  background: #f3f4f6;
  border-radius: 4px;
  font-size: 0.85rem;
  color: #374151;
}
.muted {
  color: #9ca3af;
}
.fields-title {
  margin: 0 0 0.4rem 0;
  font-size: 1rem;
  color: #111827;
}
.field-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}
.field {
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
  padding: 0.4rem 0.6rem;
  background: #f9fafb;
  border-radius: 6px;
}
.field-type {
  color: #6b7280;
  font-size: 0.8rem;
}
.meta-footer {
  display: flex;
  gap: 0.5rem;
}
.primary {
  background: #1d4ed8;
  color: #fff;
  border: 0;
  padding: 0.6rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  min-height: 40px;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}
.primary:hover {
  background: #1e40af;
}
.btn-icon {
  font-size: 1.05rem;
  line-height: 1;
}
.on-map-badge {
  display: inline-block;
  padding: 0.1rem 0.45rem;
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
}
.link {
  background: transparent;
  color: #1d4ed8;
  border: 0;
  cursor: pointer;
  padding: 0.4rem 0.5rem;
  font-size: 0.9rem;
  border-radius: 4px;
}
.link:hover {
  background: #eff6ff;
}
</style>