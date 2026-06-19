<template>
  <aside class="sidebar">

    <!-- 로고 -->
    <div class="sidebar-logo">
      <div class="logo-icon">L</div>
      <span class="logo-text">LANCIT</span>
    </div>

    <!-- 네비게이션 -->
    <nav class="sidebar-nav">
      <!-- 프리랜서 메뉴 -->
      <template v-if="isFreelancer">
        <RouterLink to="/freelancer/dashboard" class="nav-item" active-class="active">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
            <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
          </svg>
          대시보드
        </RouterLink>
        <RouterLink to="/freelancer/calendar" class="nav-item" active-class="active">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
          </svg>
          캘린더
        </RouterLink>
        <RouterLink to="/freelancer/contracts" class="nav-item" active-class="active">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
          </svg>
          계약관리
        </RouterLink>
        <RouterLink to="/freelancer/applications" class="nav-item" active-class="active">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
          </svg>
          제안 관리
        </RouterLink>
        <RouterLink to="/freelancer/recruitments" class="nav-item" active-class="active">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          구인페이지
        </RouterLink>
        <RouterLink to="/freelancer/portfolio" class="nav-item" active-class="active">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"/>
            <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/>
          </svg>
          포트폴리오
        </RouterLink>
      </template>

      <!-- 회사 메뉴 -->
      <template v-if="isCompany">
        <RouterLink to="/company/dashboard" class="nav-item" active-class="active">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
            <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
          </svg>
          대시보드
        </RouterLink>
        <RouterLink to="/company/calendar" class="nav-item" active-class="active">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
          </svg>
          캘린더
        </RouterLink>
        <RouterLink to="/company/contracts" class="nav-item" active-class="active">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
          </svg>
          계약관리
        </RouterLink>
        <RouterLink to="/company/talents" class="nav-item" active-class="active">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
          </svg>
          인재 찾기
        </RouterLink>
        <RouterLink to="/company/recruitments" class="nav-item" active-class="active">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          공고문
        </RouterLink>
      </template>
    </nav>

    <!-- 하단: 프로필 + 로그아웃 -->
    <div class="sidebar-footer">
      <RouterLink :to="isFreelancer ? '/freelancer/account' : '/company/account'" class="profile-row">
        <div class="profile-avatar">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
        </div>
        <div class="profile-info">
          <span class="profile-name">{{ authStore.email?.split('@')[0] || '사용자' }}</span>
          <span class="profile-email">{{ authStore.email }}</span>
        </div>
      </RouterLink>

      <button class="logout-btn" @click="handleLogout">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
          <polyline points="16 17 21 12 16 7"/>
          <line x1="21" y1="12" x2="9" y2="12"/>
        </svg>
        로그아웃
      </button>
    </div>

  </aside>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/features/auth/model/authStore.js'

const router = useRouter()
const authStore = useAuthStore()

const isFreelancer = computed(() => authStore.role === 'user')
const isCompany = computed(() => authStore.role === 'company')

function handleLogout() {
  authStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.sidebar {
  width: 220px;
  min-height: 100vh;
  background-color: #1A233D;
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 100;
}

/* 로고 */
.sidebar-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 24px 20px 20px;
}

.logo-icon {
  width: 32px;
  height: 32px;
  background: white;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 700;
  color: #1A233D;
  flex-shrink: 0;
}

.logo-text {
  font-size: 18px;
  font-weight: 700;
  color: white;
  letter-spacing: 0.5px;
}

/* 네비게이션 */
.sidebar-nav {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 8px 12px;
  gap: 2px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.65);
  text-decoration: none;
  transition: all 0.15s;
  cursor: pointer;
}

.nav-item:hover {
  background-color: rgba(255, 255, 255, 0.08);
  color: white;
}

.nav-item.active {
  background-color: rgba(255, 255, 255, 0.15);
  color: white;
  font-weight: 500;
}

/* 하단 */
.sidebar-footer {
  padding: 16px 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.profile-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 8px;
  text-decoration: none;
  transition: background 0.15s;
  cursor: pointer;
}

.profile-row:hover {
  background-color: rgba(255, 255, 255, 0.08);
}

.profile-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

.profile-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow: hidden;
}

.profile-name {
  font-size: 14px;
  font-weight: 500;
  color: white;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.profile-email {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.logout-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 8px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.65);
  background: none;
  border: none;
  cursor: pointer;
  width: 100%;
  text-align: left;
  transition: all 0.15s;
}

.logout-btn:hover {
  background-color: rgba(255, 255, 255, 0.08);
  color: white;
}
</style>