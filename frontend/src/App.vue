<script setup lang="ts">
import { RouterView } from 'vue-router';

import AppHeader from './components/common/AppHeader.vue';
</script>

<template>
  <div class="app-shell">
    <AppHeader />
    <RouterView />
  </div>
</template>

<style>
.app-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
</style>