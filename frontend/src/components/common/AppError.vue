<script setup lang="ts">
interface Props {
  title?: string;
  message?: string;
  showRetry?: boolean;
}
const props = withDefaults(defineProps<Props>(), {
  title: 'Something went wrong',
  message: 'An unexpected error occurred. Please try again.',
  showRetry: true,
});
const emit = defineEmits<{ (e: 'retry'): void }>();
</script>

<template>
  <div class="error" role="alert">
    <div class="error-icon" aria-hidden="true">!</div>
    <div class="error-body">
      <h3 class="error-title">{{ props.title }}</h3>
      <p class="error-message">{{ props.message }}</p>
      <button
        v-if="props.showRetry"
        type="button"
        class="retry-button"
        @click="emit('retry')"
      >
        Try again
      </button>
    </div>
  </div>
</template>

<style scoped>
.error {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1.25rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #991b1b;
}
.error-icon {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #b91c1c;
  color: #fff;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.error-body {
  flex: 1;
}
.error-title {
  margin: 0 0 0.25rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: #7f1d1d;
}
.error-message {
  margin: 0 0 0.75rem 0;
  font-size: 0.95rem;
  color: #991b1b;
}
.retry-button {
  background: #b91c1c;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 0.5rem 0.85rem;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  min-height: 40px;
}
.retry-button:hover,
.retry-button:focus-visible {
  background: #991b1b;
}
</style>