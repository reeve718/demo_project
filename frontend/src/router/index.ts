import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/datasets',
  },
  {
    path: '/datasets',
    name: 'datasets',
    component: () => import('../views/DatasetCatalogueView.vue'),
  },
  {
    path: '/datasets/:slug',
    name: 'dataset-detail',
    component: () => import('../views/DatasetDetailView.vue'),
    props: true,
  },
  {
    path: '/map',
    name: 'map',
    component: () => import('../views/MapView.vue'),
  },
  {
    path: '/about',
    name: 'about',
    component: () => import('../views/AboutView.vue'),
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/datasets',
  },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 };
  },
});