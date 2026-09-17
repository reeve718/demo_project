<script setup lang="ts">
interface Props {
  label?: string;
  inline?: boolean;
}
withDefaults(defineProps<Props>(), { label: 'Loading…', inline: false });
</script>

<template>
  <div :class="['loading', { 'loading--inline': inline }]" role="status" aria-live="polite">
    <span class="spinner" aria-hidden="true"></span>
    <span class="loading-text">{{ label }}</span>
  </div>
</template>

<style scoped>
.loading {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1.5rem;
  color: #4b5563;
}
.loading--inline {
  padding: 0.5rem 0;
}
.spinner {
  width: 1.25rem;
  height: 1.25rem;
  border-radius: 50%;
  border: 2px solid #cbd5e1;
  border-top-color: #1d4ed8;
  animation: spin 0.8s linear infinite;
}
.loading-text {
  font-size: 0.95rem;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>