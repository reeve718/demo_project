<script setup lang="ts">
</script>

<template>
  <main class="page">
    <header class="header">
      <h1>About GeoCatalog Explorer</h1>
      <p class="subtitle">A personal learning and demo project.</p>
    </header>

    <section class="card">
      <h2>What this is</h2>
      <p>
        GeoCatalog Explorer is a personal technical learning and demo project that
        demonstrates how to build a small, modern full-stack GIS application. It pairs a
        Vue 3 + Vite + TypeScript frontend with a NestJS REST API backed by PostgreSQL
        with the PostGIS spatial extension.
      </p>
      <p>
        The dataset browser, keyword search, theme filter, dataset detail page, map
        explorer, feature click interactions, and bbox-driven feature queries are all
        intended as a working demonstration of how the pieces talk to each other —
        not as a production system.
      </p>
    </section>

    <section class="card">
      <h2>Data source</h2>
      <p>
        All coordinates, polygons, and metadata in this project are synthetic. The
        catalogue uses three small demo datasets placed inside a small bounding box
        near Hong Kong purely for visualisation convenience. None of the records
        correspond to real-world flood zones, fire stations, or public facilities.
      </p>
      <p>
        This project is not affiliated with, endorsed by, or derived from any
        government, public-sector, or commercial GIS system. No confidential data,
        source code, screenshots, branding, or internal information from any external
        organisation has been used.
      </p>
    </section>

    <section class="card">
      <h2>Technology stack</h2>
      <ul class="stack">
        <li><strong>Frontend:</strong> Vue 3, Vite, Vue Router, Pinia, TypeScript, MapLibre GL JS, Vitest, Vue Test Utils</li>
        <li><strong>Backend:</strong> NestJS, TypeORM, class-validator, Swagger, Jest, Supertest</li>
        <li><strong>Database:</strong> PostgreSQL 16 with PostGIS 3.4</li>
        <li><strong>Tooling:</strong> Docker Compose, nginx (frontend runtime)</li>
      </ul>
    </section>

    <section class="card">
      <h2>Out of scope for this MVP</h2>
      <ul>
        <li>Authentication and authorisation</li>
        <li>External API keys or third-party map services</li>
        <li>Cloud deployment, Kubernetes, or production scaling</li>
        <li>Real STAC server integration</li>
        <li>CesiumJS / ArcGIS SDK / 3D globe rendering</li>
        <li>File upload, dataset editing, or workflow management</li>
        <li>AI-assisted features</li>
      </ul>
    </section>

    <section class="card">
      <h2>Disclaimer</h2>
      <p>
        This is a personal demo project provided as-is, with no warranty. It is not
        suitable for operational use. Do not use it to make decisions about real-world
        geography, public safety, or any other consequential matter.
      </p>
    </section>
  </main>
</template>

<style scoped>
.page {
  max-width: 880px;
  margin: 0 auto;
  padding: 1.5rem 1rem 3rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.header h1 {
  margin: 0 0 0.25rem 0;
  font-size: 1.6rem;
}
.subtitle {
  margin: 0;
  color: #4b5563;
}
.card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 1.1rem 1.2rem;
}
.card h2 {
  margin: 0 0 0.6rem 0;
  font-size: 1.1rem;
  color: #111827;
}
.card p,
.card ul {
  margin: 0 0 0.6rem 0;
  color: #374151;
  line-height: 1.55;
}
.card ul {
  padding-left: 1.2rem;
}
.stack li,
.card ul li {
  margin-bottom: 0.25rem;
}
</style>