<script setup lang="ts">
interface Props {
  themes: string[];
  modelValue: string;
}
const props = defineProps<Props>();
const emit = defineEmits<{ (e: 'update:modelValue', value: string): void }>();

function onChange(event: Event) {
  emit('update:modelValue', (event.target as HTMLSelectElement).value);
}
</script>

<template>
  <div class="theme-filter">
    <label class="theme-label" for="theme-filter">Theme</label>
    <select
      id="theme-filter"
      class="theme-select"
      :value="props.modelValue"
      @change="onChange"
    >
      <option value="">All themes</option>
      <option v-for="t in props.themes" :key="t" :value="t">{{ t }}</option>
    </select>
  </div>
</template>

<style scoped>
.theme-filter {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}
.theme-label {
  font-size: 0.85rem;
  font-weight: 500;
  color: #374151;
}
.theme-select {
  padding: 0.55rem 0.7rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: #fff;
  font-size: 1rem;
  min-height: 40px;
}
.theme-select:focus-visible {
  outline: 2px solid #1d4ed8;
  outline-offset: 1px;
}
</style>