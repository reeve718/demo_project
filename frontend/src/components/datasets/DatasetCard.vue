<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink } from 'vue-router';

import type { DatasetSummary } from '../../types';

interface Props {
  dataset: DatasetSummary;
}
const props = defineProps<Props>();

const updatedDate = computed(() => {
  if (!props.dataset.updatedAt) return '';
  try {
    return new Date(props.dataset.updatedAt).toLocaleDateString();
  } catch {
    return props.dataset.updatedAt;
  }
});
</script>

<template>
  <article class="card" data-testid="dataset-card">
    <header class="card-header">
      <span class="theme-badge">{{ props.dataset.theme || 'Uncategorised' }}</span>
      <span class="publisher">{{ props.dataset.publisher }}</span>
    </header>

    <h3 class="card-title">{{ props.dataset.title }}</h3>
    <p class="card-description">{{ props.dataset.description }}</p>

    <ul v-if="props.dataset.tags.length > 0" class="tag-list" aria-label="Tags">
      <li v-for="t in props.dataset.tags" :key="t" class="tag">{{ t }}</li>
    </ul>

    <footer class="card-footer">
      <span class="updated">Updated {{ updatedDate }}</span>
      <RouterLink :to="`/datasets/${props.dataset.slug}`" class="detail-link">
        View details →
      </RouterLink>
    </footer>
  </article>
</template>

<style scoped>
.card {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: #fff;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  transition: border-color 0.15s, box-shadow 0.15s, transform 0.15s;
}
.card:hover {
  border-color: #93c5fd;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
  transform: translateY(-1px);
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
}
.theme-badge {
  display: inline-block;
  padding: 0.2rem 0.55rem;
  border-radius: 999px;
  background: #dbeafe;
  color: #1e40af;
  font-size: 0.75rem;
  font-weight: 600;
}
.publisher {
  font-size: 0.85rem;
  color: #6b7280;
}
.card-title {
  margin: 0;
  font-size: 1.05rem;
  color: #111827;
}
.card-description {
  margin: 0;
  color: #4b5563;
  font-size: 0.95rem;
  line-height: 1.4;
}
.tag-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
}
.tag {
  padding: 0.15rem 0.5rem;
  background: #f3f4f6;
  border-radius: 4px;
  font-size: 0.78rem;
  color: #374151;
}
.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 0.5rem;
  border-top: 1px solid #f3f4f6;
  margin-top: 0.25rem;
}
.updated {
  font-size: 0.78rem;
  color: #6b7280;
}
.detail-link {
  font-size: 0.9rem;
  font-weight: 500;
  color: #1d4ed8;
  text-decoration: none;
  padding: 0.35rem 0.5rem;
  border-radius: 4px;
}
.detail-link:hover {
  background: #eff6ff;
}
</style>