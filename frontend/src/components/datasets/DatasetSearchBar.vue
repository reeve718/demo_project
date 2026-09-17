<script setup lang="ts">
import { ref, watch } from 'vue';

interface Props {
  modelValue: string;
  placeholder?: string;
}
const props = withDefaults(defineProps<Props>(), { placeholder: 'Search datasets…' });
const emit = defineEmits<{ (e: 'update:modelValue', value: string): void }>();

const local = ref<string>(props.modelValue);

watch(
  () => props.modelValue,
  (v) => {
    if (v !== local.value) local.value = v;
  },
);

let timer: ReturnType<typeof setTimeout> | null = null;
function onInput() {
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => emit('update:modelValue', local.value), 250);
}

function clear() {
  local.value = '';
  emit('update:modelValue', '');
}
</script>

<template>
  <div class="search">
    <label class="search-label" for="dataset-search">Search</label>
    <div class="search-input-wrap">
      <input
        id="dataset-search"
        v-model="local"
        type="search"
        class="search-input"
        :placeholder="props.placeholder"
        autocomplete="off"
        @input="onInput"
      />
      <button
        v-if="local.length > 0"
        type="button"
        class="search-clear"
        aria-label="Clear search"
        @click="clear"
      >
        ×
      </button>
    </div>
  </div>
</template>

<style scoped>
.search {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}
.search-label {
  font-size: 0.85rem;
  font-weight: 500;
  color: #374151;
}
.search-input-wrap {
  position: relative;
}
.search-input {
  width: 100%;
  padding: 0.6rem 2.2rem 0.6rem 0.85rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 1rem;
  background: #fff;
  min-height: 40px;
}
.search-input:focus-visible {
  outline: 2px solid #1d4ed8;
  outline-offset: 1px;
}
.search-clear {
  position: absolute;
  right: 0.5rem;
  top: 50%;
  transform: translateY(-50%);
  background: transparent;
  border: 0;
  width: 28px;
  height: 28px;
  font-size: 1.1rem;
  color: #6b7280;
  cursor: pointer;
  border-radius: 4px;
}
.search-clear:hover {
  background: #e5e7eb;
  color: #111827;
}
</style>