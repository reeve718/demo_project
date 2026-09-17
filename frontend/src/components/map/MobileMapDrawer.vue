<script setup lang="ts">
interface Props {
  open: boolean;
  title?: string;
}
const props = withDefaults(defineProps<Props>(), { title: 'Layers' });
defineEmits<{ (e: 'close'): void }>();
</script>

<template>
  <div v-if="props.open" class="drawer-backdrop" @click.self="$emit('close')">
    <aside class="drawer" role="dialog" aria-label="Map controls">
      <header class="drawer-header">
        <h3>{{ props.title }}</h3>
        <button
          type="button"
          class="close-btn"
          aria-label="Close drawer"
          @click="$emit('close')"
        >
          ×
        </button>
      </header>
      <div class="drawer-body">
        <slot />
      </div>
    </aside>
  </div>
</template>

<style scoped>
.drawer-backdrop {
  position: absolute;
  background: rgba(0, 0, 0, 0.35);
  z-index: 30;
  inset: 0;
  display: flex;
  align-items: flex-end;
}
.drawer {
  width: 100%;
  max-height: 80vh;
  background: #fff;
  border-radius: 16px 16px 0 0;
  padding: 1rem;
  overflow: auto;
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.18);
}
.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}
.drawer-header h3 {
  margin: 0;
  font-size: 1rem;
}
.close-btn {
  background: transparent;
  border: 0;
  font-size: 1.3rem;
  width: 36px;
  height: 36px;
  cursor: pointer;
  border-radius: 6px;
}
.close-btn:hover {
  background: #f3f4f6;
}
</style>