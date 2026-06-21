import { useAuthStore } from '@/features/auth/model/authStore.js'

function requireFreelancer() {
  const authStore = useAuthStore()
  if (!authStore.isLoggedIn) return { name: 'Login' }
  if (!authStore.isFreelancer) return { name: 'Forbidden' }
  return true
}

//라우트 목록
const routes = [
  // ── Auth (로그인/회원가입) ──────────────────
  {
    path: '/',
    component: () => import('@/layouts/AuthLayout.vue'),
    children: [
      { path: '', redirect: '/login' },
      { path: 'login', name: 'Login', component: () => import('@/pages/auth/LoginPage.vue') },
      { path: 'signup', name: 'Signup', component: () => import('@/pages/auth/SignupPage.vue') },
      { path: 'password-reset', name: 'PasswordReset', component: () => import('@/pages/auth/PasswordResetPage.vue') },
      { path: 'password-new', name: 'PasswordNew', component: () => import('@/pages/auth/PasswordNewPage.vue') },
    ]
  },

  // ── Freelancer Layout ──────────────────────
  {
    path: '/freelancer',
    component: () => import('@/layouts/FreelancerLayout.vue'),
    meta: { requiresAuth: true, role: 'user' },
    children: [
      { path: 'dashboard', name: 'FreelancerDashboard', component: () => import('@/pages/dashboard/FreelancerDashboardPage.vue') },
      { path: 'account', name: 'AccountProfile', component: () => import('@/pages/account/AccountProfilePage.vue') },
      { path: 'calendar', name: 'Calendar', component: () => import('@/pages/calendar/CalendarPage.vue') },
      { path: 'contracts', name: 'ContractList', component: () => import('@/pages/contracts/ContractListPage.vue') },
      { path: 'contracts/:id', name: 'ContractDetail', component: () => import('@/pages/contracts/ContractDetailPage.vue') },
      { path: 'recruitments', name: 'RecruitmentList', component: () => import('@/pages/recruitments/RecruitmentListPage.vue') },
      { path: 'recruitments/:recruitmentId/apply', name: 'RecruitmentApply', component: () => import('@/pages/recruitments/RecruitmentApplyPage.vue'), beforeEnter: requireFreelancer },
      { path: 'recruitments/:id', name: 'RecruitmentDetail', component: () => import('@/pages/recruitments/RecruitmentDetailPage.vue') },
      { path: 'recruitments/bookmarks', name: 'RecruitmentBookmark', component: () => import('@/pages/recruitments/RecruitmentBookmarkPage.vue') },
      { path: 'applications', name: 'MyApplicationList', component: () => import('@/pages/applications/MyApplicationListPage.vue') },
      { path: 'applications/:id', name: 'ApplicationDetail', component: () => import('@/pages/applications/ApplicationDetailPage.vue') },
      { path: 'portfolio', name: 'PortfolioList', component: () => import('@/pages/portfolio/PortfolioListPage.vue') },
      { path: 'portfolio/new', name: 'PortfolioCreate', component: () => import('@/pages/portfolio/PortfolioEditorPage.vue') },
      { path: 'portfolio/:id', name: 'PortfolioDetail', component: () => import('@/pages/portfolio/PortfolioDetailPage.vue') },
      {
        path: 'portfolio/:id/edit',
        alias: 'portfolio/edit/:id',
        name: 'PortfolioEditor',
        component: () => import('@/pages/portfolio/PortfolioEditorPage.vue')
      },
      { path: 'notifications', name: 'Notifications', component: () => import('@/pages/notifications/NotificationListPage.vue') },
    ]
  },

  // ── Company Layout ─────────────────────────
  {
    path: '/company',
    component: () => import('@/layouts/CompanyLayout.vue'),
    meta: { requiresAuth: true, role: 'company' },
    children: [
      { path: 'dashboard', name: 'CompanyDashboard', component: () => import('@/pages/dashboard/CompanyDashboardPage.vue') },
      { path: 'account', name: 'CompanyProfile', component: () => import('@/pages/account/CompanyProfilePage.vue') },
      { path: 'calendar', name: 'CompanyCalendar', component: () => import('@/pages/calendar/CalendarPage.vue') },
      { path: 'contracts', name: 'CompanyContractList', component: () => import('@/pages/contracts/ContractListPage.vue') },
      { path: 'contracts/:id', name: 'CompanyContractDetail', component: () => import('@/pages/contracts/ContractDetailPage.vue') },
      { path: 'recruitments', name: 'CompanyRecruitmentList', component: () => import('@/pages/company/recruitments/CompanyRecruitmentListPage.vue') },
      { path: 'recruitments/new', name: 'CompanyRecruitmentCreate', component: () => import('@/pages/company/recruitments/CompanyRecruitmentEditorPage.vue') },
      { path: 'recruitments/:recruitmentId', name: 'CompanyRecruitmentDetail', component: () => import('@/pages/company/recruitments/CompanyRecruitmentDetailPage.vue') },
      { path: 'recruitments/:recruitmentId/edit', name: 'CompanyRecruitmentEdit', component: () => import('@/pages/company/recruitments/CompanyRecruitmentEditorPage.vue') },
      { path: 'recruitments/:recruitmentId/applicants/:applicationId', name: 'CompanyApplicantDetail', component: () => import('@/pages/company/applicants/CompanyApplicantDetailPage.vue') },
      { path: 'applicants/:recruitmentId/:applicationId', redirect: to => ({ name: 'CompanyApplicantDetail', params: { recruitmentId: to.params.recruitmentId, applicationId: to.params.applicationId } }) },
      { path: 'talents', name: 'TalentSearch', component: () => import('@/pages/company/talents/TalentSearchPage.vue') },
      { path: 'talents/:id', name: 'TalentDetail', component: () => import('@/pages/company/talents/TalentDetailPage.vue') },
      { path: 'bookmarks', name: 'TalentBookmark', component: () => import('@/pages/company/bookmarks/TalentBookmarkPage.vue') },
      { path: 'notifications', name: 'CompanyNotifications', component: () => import('@/pages/notifications/NotificationListPage.vue') },
      { path: 'talents/:id', name: 'TalentDetail', component: () => import('@/pages/company/talents/TalentDetailPage.vue') },
      { path: 'proposal/select', name: 'ProposalSelect', component: () => import('@/pages/proposal/ProposalSelectPage.vue') },

      // 포트폴리오 상세 -라우팅만 (임시 빈 페이지)
      { path: 'portfolio/:id', name: 'TalentPortfolioDetail', component: () => import('@/pages/portfolio/PortfolioDetailPage.vue') },
    ]
  },

  // ── Error ──────────────────────────────────
  { path: '/403', name: 'Forbidden', component: () => import('@/pages/error/ForbiddenPage.vue') },
  { path: '/:pathMatch(.*)*', name: 'NotFound', component: () => import('@/pages/error/NotFoundPage.vue') },
]

export default routes
