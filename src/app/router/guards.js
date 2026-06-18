// 인증, 권한 가드

import { useAuthStore } from '@/features/auth/model/authStore.js'

export function setupGuards(router) {
  router.beforeEach((to, from, next) => {
    const authStore = useAuthStore()

    // 인증 필요한 페이지
    if (to.meta.requiresAuth && !authStore.isLoggedIn) {
      return next('/login')
    }

    // 역할 체크 (user / company)
    if (to.meta.role && authStore.role !== to.meta.role) {
      return next('/403')
    }

    next()
  })
}