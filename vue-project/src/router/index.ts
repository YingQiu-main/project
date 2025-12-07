import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/home/index.vue'),
  },
  {
    path: '/cet4',
    name: 'cet4',
    component: () => import('@/views/cet4/index.vue'),
  },
  {
    path: '/cet6',
    name: 'cet6',
    component: () => import('@/views/cet6/index.vue'),
  },
  {
    path: '/article',
    name: 'article',
    component: () => import('@/views/article/index.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

export default router
