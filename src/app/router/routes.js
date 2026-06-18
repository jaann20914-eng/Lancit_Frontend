const routes = [
  {
    path: '/login',
    component: () => import('@/layouts/AuthLayout.vue'),
    children: [
      { path: '', component: () => import('@/pages/auth/LoginPage.vue') }
    ]
  },
  {
    path: '/',
    component: () => import('@/layouts/FreelancerLayout.vue'),
    children: [
      { path: 'contracts', component: () => import('@/pages/contracts/ContractListPage.vue') },
      { path: 'contracts/:id', component: () => import('@/pages/contracts/ContractDetailPage.vue') },
      // 나머지 라우트 추가
    ]
  }
]

export default routes