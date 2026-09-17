<script setup lang="ts">
import { RouterLink } from 'vue-router';
</script>

<template>
  <header class="app-header">
    <RouterLink to="/" class="brand" aria-label="GeoCatalog Explorer home">
      <span class="brand-mark" aria-hidden="true">⛰</span>
      <span class="brand-name">GeoCatalog Explorer</span>
    </RouterLink>

    <nav class="app-nav" aria-label="Primary">
      <RouterLink to="/datasets" class="nav-link">Datasets</RouterLink>
      <RouterLink to="/map" class="nav-link">Map</RouterLink>
      <RouterLink to="/about" class="nav-link">About</RouterLink>
    </nav>
  </header>
</template>

<style scoped>
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1.25rem;
  background: #1f2937;
  color: #f9fafb;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
  z-index: 50;
}
.brand {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: inherit;
  text-decoration: none;
  font-weight: 600;
  font-size: 1.05rem;
}
.brand-mark {
  font-size: 1.25rem;
}
.app-nav {
  display: flex;
  gap: 0.25rem;
}
.nav-link {
  display: inline-flex;
  align-items: center;
  padding: 0.5rem 0.85rem;
  border-radius: 6px;
  color: rgba(249, 250, 251, 0.85);
  text-decoration: none;
  font-weight: 500;
  min-height: 40px;
  min-width: 40px;
}
.nav-link:hover,
.nav-link:focus-visible {
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
}
.nav-link.router-link-active {
  background: rgba(255, 255, 255, 0.16);
  color: #fff;
}
@media (max-width: 600px) {
  .brand-name {
    display: none;
  }
}
</style>