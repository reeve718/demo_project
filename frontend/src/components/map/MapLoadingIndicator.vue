<script setup lang="ts">
import type { RequestStatus } from '../../types';

interface Props {
  status: RequestStatus;
  errorMessage?: string;
  visible: boolean;
}
const props = withDefaults(defineProps<Props>(), { errorMessage: '' });
</script>

<template>
  <div v-if="props.visible" class="indicator" :data-status="props.status">
    <span v-if="props.status === 'loading'" class="dot dot--loading" aria-hidden="true"></span>
    <span v-else-if="props.status === 'error'" class="dot dot--error" aria-hidden="true">!</span>
    <span v-else-if="props.status === 'empty'" class="dot dot--empty" aria-hidden="true">0</span>
    <span v-else class="dot dot--success" aria-hidden="true">✓</span>

    <span class="indicator-text">
      <template v-if="props.status === 'loading'">Loading features…</template>
      <template v-else-if="props.status === 'error'">
        {{ props.errorMessage || 'Failed to load features' }}
      </template>
      <template v-else-if="props.status === 'empty'">No features in current view</template>
      <template v-else>Features loaded</template>
    </span>
  </div>
</template>

<style scoped>
.indicator {
  position: absolute;
  top: 0.75rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.45rem 0.85rem;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid #e5e7eb;
  border-radius: 999px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
  font-size: 0.85rem;
  z-index: 10;
}
.indicator[data-status='error'] {
  border-color: #fca5a5;
  background: #fef2f2;
  color: #991b1b;
}
.indicator[data-status='empty'] {
  border-color: #fcd34d;
  background: #fffbeb;
  color: #92400e;
}
.dot {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  color: #fff;
}
.dot--loading {
  background: transparent;
  border: 2px solid #cbd5e1;
  border-top-color: #1d4ed8;
  animation: spin 0.7s linear infinite;
}
.dot--error {
  background: #b91c1c;
}
.dot--empty {
  background: #b45309;
}
.dot--success {
  background: #16a34a;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>