<script setup lang="ts">
interface Props {
  title?: string;
  message?: string;
}
const props = withDefaults(defineProps<Props>(), {
  title: 'No results found',
  message: 'Try a different search term or clear the filters.',
});
</script>

<template>
  <div class="empty" role="status" data-testid="empty-state">
    <div class="empty-icon" aria-hidden="true">∅</div>
    <h3 class="empty-title">{{ props.title }}</h3>
    <p class="empty-message">{{ props.message }}</p>
    <slot />
  </div>
</template>

<style scoped>
.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 2rem 1rem;
  color: #4b5563;
  background: #f9fafb;
  border: 1px dashed #d1d5db;
  border-radius: 8px;
}
.empty-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #e5e7eb;
  color: #374151;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  margin-bottom: 0.75rem;
}
.empty-title {
  margin: 0 0 0.25rem 0;
  font-size: 1.05rem;
  color: #111827;
}
.empty-message {
  margin: 0;
  font-size: 0.95rem;
}
</style>