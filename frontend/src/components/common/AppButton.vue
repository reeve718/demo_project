<script setup lang="ts">
type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';
interface Props {
  variant?: Variant;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  fullWidth?: boolean;
}
const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  disabled: false,
  type: 'button',
  fullWidth: false,
});
defineEmits<{ (e: 'click', evt: MouseEvent): void }>();
</script>

<template>
  <button
    :type="props.type"
    :disabled="props.disabled"
    :class="['app-button', `app-button--${props.variant}`, { 'app-button--block': props.fullWidth }]"
    @click="(e) => $emit('click', e)"
  >
    <slot />
  </button>
</template>

<style scoped>
.app-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  padding: 0.55rem 0.9rem;
  border-radius: 6px;
  border: 1px solid transparent;
  font-weight: 500;
  font-size: 0.95rem;
  cursor: pointer;
  min-height: 40px;
  min-width: 40px;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
}
.app-button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
.app-button--primary {
  background: #1d4ed8;
  color: #fff;
}
.app-button--primary:hover:not(:disabled),
.app-button--primary:focus-visible:not(:disabled) {
  background: #1e40af;
}
.app-button--secondary {
  background: #fff;
  color: #1d4ed8;
  border-color: #1d4ed8;
}
.app-button--secondary:hover:not(:disabled),
.app-button--secondary:focus-visible:not(:disabled) {
  background: #eff6ff;
}
.app-button--danger {
  background: #b91c1c;
  color: #fff;
}
.app-button--danger:hover:not(:disabled) {
  background: #991b1b;
}
.app-button--ghost {
  background: transparent;
  color: #1f2937;
}
.app-button--ghost:hover:not(:disabled) {
  background: rgba(0, 0, 0, 0.06);
}
.app-button--block {
  width: 100%;
}
</style>