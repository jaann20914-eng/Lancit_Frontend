// 인증, 권한 가드

import { useAuthStore } from '@/features/auth/model/authStore.js'

export function setupGuards(router) {
  router.beforeEach((to, from, next) => {
    const authStore = useAuthStore()
    // TODO: 개발 완료 후 아래 주석 해제
    // 인증 필요한 페이지
    //if (to.meta.requiresAuth && !authStore.isLoggedIn) {
    //  return next('/login')
    //}

    // 역할 체크 (user / company)
    //if (to.meta.role && authStore.role !== to.meta.role) {
    //  return next('/403')
    //}


    // 개발용 임시 role 강제 설정
    if (to.path.startsWith('/company') && !authStore.role) {
      authStore.role = 'company'
    }
    if (to.path.startsWith('/freelancer') && !authStore.role) {
      authStore.role = 'user'
    }

    next()
  })
}