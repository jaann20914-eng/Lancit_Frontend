<template>
  <div class="page">
    <RouterLink to="/company/talents" class="back-link">‹ 목록으로</RouterLink>

    <!-- 프로필 카드 -->
    <div class="profile-card">
      <div class="profile-avatar">
        <img v-if="profile.profileImageUrl" :src="profile.profileImageUrl" />
        <span v-else>{{ profile.name?.charAt(0) }}</span>
      </div>

      <div class="profile-body">
        <div class="profile-head">
          <h2 class="profile-name">프로필</h2>
          <button class="btn-propose" @click="goPropose">제안하기</button>
        </div>

        <div class="tag-row">
          <span class="tag">{{ jobCategoryLabel(profile.jobCategory) }}</span>
        </div>

        <p class="profile-intro">{{ profile.intro || '소개글이 없습니다.' }}</p>

        <div class="profile-stats">
          <span class="stat">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
            </svg>
            {{ profile.viewCount ?? 0 }}
          </span>
          <span class="stat">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3zM7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3"/>
            </svg>
            {{ profile.likeCount ?? 0 }}
          </span>
        </div>
      </div>
    </div>

    <!-- 검색 + 정렬 -->
    <div class="search-bar">
      <div class="search-input-wrap">
        <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input v-model="keyword" type="text" class="search-input" placeholder="프로젝트로 검색..." @keyup.enter="fetchPortfolios" />
      </div>
      <select v-model="categoryFilter" class="filter-select" @change="fetchPortfolios">
        <option value="">전체</option>
        <option value="WEB_APP">웹/앱</option>
        <option value="DESIGN">디자인</option>
        <option value="VIDEO">영상</option>
      </select>
      <select v-model="sortType" class="filter-select" @change="fetchPortfolios">
        <option value="LATEST">최신순</option>
        <option value="OLDEST">오래된순</option>
      </select>
    </div>

    <!-- 포트폴리오 그리드 (공개 프로젝트만) -->
    <div v-if="isLoading" class="loading">불러오는 중...</div>
    <div v-else-if="portfolios.length === 0" class="empty-state">
      <p>공개된 포트폴리오가 없습니다</p>
    </div>

    <div v-else class="portfolio-grid">
      <div
        v-for="item in portfolios"
        :key="item.portfolioId"
        class="portfolio-card"
        @click="goPortfolioDetail(item.portfolioId)"
      >
        <div class="portfolio-thumb">
          <img v-if="item.bannerUrl" :src="item.bannerUrl" />
          <div v-else class="thumb-placeholder"></div>
          <span class="thumb-tag">{{ categoryTagLabel(item.category) }}</span>
        </div>

        <div class="portfolio-body">
          <span class="portfolio-category">{{ categoryLabel(item.category) }}</span>
          <p class="portfolio-title">{{ item.title }}</p>
          <p class="portfolio-summary">{{ item.summary }}</p>
          <div class="portfolio-footer">
            <span class="portfolio-date">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
              </svg>
              {{ formatDate(item.workEndAt || item.createdAt) }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- 페이지네이션 -->
    <div class="pagination" v-if="totalPages > 1">
      <button class="page-btn" :disabled="currentPage === 1" @click="changePage(currentPage - 1)">‹</button>
      <button
        v-for="p in totalPages"
        :key="p"
        :class="['page-btn', p === currentPage ? 'active' : '']"
        @click="changePage(p)"
      >
        {{ p }}
      </button>
      <button class="page-btn" :disabled="currentPage === totalPages" @click="changePage(currentPage + 1)">›</button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getTalentProfile, getTalentPublicPortfolios } from '@/features/talent/api/talentApi.js'

const route = useRoute()
const router = useRouter()

const freelancerEmail = route.params.id

const profile = reactive({
  email: freelancerEmail,
  name: '',
  jobCategory: '',
  intro: '',
  profileImageUrl: null,
  viewCount: 0,
  likeCount: 0
})

const portfolios = ref([])
const isLoading = ref(false)
const keyword = ref('')
const categoryFilter = ref('')
const sortType = ref('LATEST')
const currentPage = ref(1)
const totalPages = ref(1)
const pageSize = 4

const jobCategoryMap = {
  IT: 'IT', DESIGN: '디자이너', MARKETING: '마케팅', VIDEO: '영상',
  MUSIC: '음악', EDUCATION: '교육', WRITING: '작문', ETC: '기타'
}

function jobCategoryLabel(code) {
  return jobCategoryMap[code] || code || ''
}

// 포트폴리오 카테고리 라벨 (카드 본문 상단 태그)
const portfolioCategoryMap = {
  WEB_APP: '웹/앱', DESIGN: '디자인', VIDEO: '영상',
  BRANDING: '브랜딩', PLANNING: '기획'
}

function categoryLabel(code) {
  return portfolioCategoryMap[code] || code || ''
}

// 썸네일 위 좌상단 작은 태그 (디자인 와이어프레임의 색상칩 텍스트)
function categoryTagLabel(code) {
  return portfolioCategoryMap[code] || code || ''
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toISOString().slice(0, 10)
}

async function fetchProfile() {
  try {
    const res = await getTalentProfile(freelancerEmail)
    Object.assign(profile, res.data.data)
  } catch {
    // noop
  }
}

async function fetchPortfolios() {
  isLoading.value = true
  try {
    const res = await getTalentPublicPortfolios(freelancerEmail, {
      keyword: keyword.value,
      category: categoryFilter.value,
      sort: sortType.value,
      page: currentPage.value,
      size: pageSize
    })
    const data = res.data.data
    portfolios.value = data.content || data.list || []
    totalPages.value = data.totalPages || 1
  } catch {
    portfolios.value = []
  } finally {
    isLoading.value = false
  }
}

function changePage(p) {
  if (p < 1 || p > totalPages.value) return
  currentPage.value = p
  fetchPortfolios()
}

function goPortfolioDetail(portfolioId) {
  // 포트폴리오 상세는 다른 파트 - 라우팅만 연결
  // from/freelancerEmail 쿼리로 "어디서 왔는지" 전달 -> 상세 페이지의 뒤로가기 버튼이
  // 인재 상세(TalentDetail)로 돌아갈 수 있도록 함
  router.push({
    name: 'TalentPortfolioDetail',
    params: { id: portfolioId },
    query: { from: 'talent', freelancerEmail: freelancerEmail }
  })
}

function goPropose() {
  router.push({ name: 'ProposalSelect', query: { freelancerEmail: freelancerEmail } })
}

onMounted(() => {
  fetchProfile()
  fetchPortfolios()
})
</script>

<style scoped>
.page {
  padding: 32px;
  max-width: 100%;
}

.back-link {
  display: inline-block;
  font-size: 13px;
  color: #6C757D;
  text-decoration: none;
  margin-bottom: 16px;
}

.back-link:hover { color: #1A233D; }

/* 프로필 카드 */
.profile-card {
  display: flex;
  gap: 20px;
  background: white;
  border: 1px solid #E5E7EB;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 20px;
}

.profile-avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: #D1D5DB;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  font-weight: 600;
  color: #6B7280;
  flex-shrink: 0;
  overflow: hidden;
}

.profile-avatar img { width: 100%; height: 100%; object-fit: cover; }

.profile-body { flex: 1; }

.profile-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.profile-name {
  font-size: 18px;
  font-weight: 700;
  color: #1A233D;
  margin: 0;
}

.btn-propose {
  padding: 8px 16px;
  background: #1A233D;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
}

.tag-row { margin-bottom: 8px; }

.tag {
  display: inline-block;
  padding: 2px 10px;
  background: #E8EDF5;
  color: #1A233D;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 500;
}

.profile-intro {
  font-size: 13px;
  color: #6C757D;
  margin: 0 0 12px;
  line-height: 1.5;
}

.profile-stats { display: flex; gap: 12px; }

.stat {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #9CA3AF;
}

/* 검색바 */
.search-bar {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
}

.search-input-wrap {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon { position: absolute; left: 12px; color: #9CA3AF; }

.search-input {
  width: 100%;
  height: 40px;
  padding: 0 12px 0 36px;
  border: 1px solid #E5E7EB;
  border-radius: 6px;
  font-size: 14px;
  outline: none;
}

.search-input:focus { border-color: #1A233D; }

.filter-select {
  height: 40px;
  padding: 0 12px;
  border: 1px solid #E5E7EB;
  border-radius: 6px;
  font-size: 14px;
  color: #1A233D;
  background: white;
  cursor: pointer;
  flex-shrink: 0;
}

/* 그리드 */
.loading, .empty-state {
  text-align: center;
  padding: 60px 0;
  color: #9CA3AF;
}

.portfolio-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

@media (max-width: 1100px) {
  .portfolio-grid { grid-template-columns: repeat(2, 1fr); }
}

.portfolio-card {
  background: white;
  border: 1px solid #E5E7EB;
  border-radius: 10px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.15s;
}

.portfolio-card:hover {
  border-color: #1A233D;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  transform: translateY(-2px);
}

.portfolio-thumb {
  width: 100%;
  height: 110px;
  background: #1A233D;
  position: relative;
}

.portfolio-thumb img { width: 100%; height: 100%; object-fit: cover; }

.thumb-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #1A233D, #3A4A6B);
}

.thumb-tag {
  position: absolute;
  top: 8px;
  left: 8px;
  background: rgba(255,255,255,0.9);
  color: #1A233D;
  font-size: 10px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 999px;
}

.portfolio-body { padding: 12px 14px 14px; }

.portfolio-category {
  display: inline-block;
  font-size: 10px;
  font-weight: 600;
  color: #1A233D;
  background: #E8EDF5;
  padding: 2px 8px;
  border-radius: 999px;
  margin-bottom: 6px;
}

.portfolio-title {
  font-size: 13px;
  font-weight: 700;
  color: #1A233D;
  margin: 0 0 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.portfolio-summary {
  font-size: 11px;
  color: #9CA3AF;
  margin: 0 0 10px;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 30px;
}

.portfolio-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.portfolio-date {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  color: #9CA3AF;
}

/* 페이지네이션 */
.pagination {
  display: flex;
  justify-content: center;
  gap: 4px;
  margin-top: 24px;
}

.page-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: none;
  border-radius: 6px;
  font-size: 13px;
  color: #6C757D;
  cursor: pointer;
}

.page-btn:hover:not(:disabled) { background: #F3F4F6; }
.page-btn.active { background: #1A233D; color: white; font-weight: 600; }
.page-btn:disabled { opacity: 0.3; cursor: not-allowed; }
</style>
