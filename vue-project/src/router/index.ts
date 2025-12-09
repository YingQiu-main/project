import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { isAuthenticated } from '@/utils/auth'

const routes: RouteRecordRaw[] = [
  {
    path: '/register',
    name: 'register',
    component: () => import('@/views/register/index.vue'),
    meta: {
      requiresAuth: false, // 不需要认证，但已登录用户应该重定向
      guestOnly: true // 仅游客可访问
    },
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/login/index.vue'),
    meta: {
      requiresAuth: false, // 不需要认证，但已登录用户应该重定向
      guestOnly: true // 仅游客可访问
    },
  },
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/home/index.vue'),
    meta: {
      requiresAuth: true // 需要认证
    },
  },
  {
    path: '/cet4',
    name: 'cet4',
    component: () => import('@/views/cet4/index.vue'),
    meta: {
      requiresAuth: true // 需要认证
    },
  },
  {
    path: '/cet6',
    name: 'cet6',
    component: () => import('@/views/cet6/index.vue'),
    meta: {
      requiresAuth: true // 需要认证
    },
  },
  {
    path: '/article',
    name: 'article',
    component: () => import('@/views/article/index.vue'),
    meta: {
      requiresAuth: true // 需要认证
    },
  },
  {
    path: '/article/detail',
    name: 'article-detail',
    component: () => import('@/views/article/detail.vue'),
    meta: {
      requiresAuth: true // 需要认证
    },
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const authenticated = isAuthenticated()

  // 检查路由是否需要认证
  if (to.meta.requiresAuth) {
    // 需要认证的路由
    if (!authenticated) {
      // 未登录，重定向到登录页
      next({
        path: '/login',
        query: { redirect: to.fullPath } // 保存原始路径，登录后可以跳转回去
      })
    } else {
      // 已登录，允许访问
      next()
    }
  } else if (to.meta.guestOnly) {
    // 仅游客可访问的路由（登录/注册页）
    if (authenticated) {
      // 已登录，重定向到首页
      next('/')
    } else {
      // 未登录，允许访问
      next()
    }
  } else {
    // 其他路由，直接允许访问
    next()
  }
})

export default router
