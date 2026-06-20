<template>
  <div class="page">
    <h1 class="page-title">인재 찾기</h1>
    <p class="page-sub">다양한 프리랜서를 찾아보세요</p>

    <!-- 탭 -->
    <div class="tab-bar">
        <button
            v-for="tab in jobCategoryTabs"
            :key="tab.value"
            :class="['tab-item', activeTab === tab.value ? 'active' : '']"
            @click="changeTab(tab.value)"
        >
            {{ tab.label }}
        </button>
    </div>

    <!-- 검색 + 정렬 -->
    <div class="search-bar">
      <div class="search-input-wrap">
        <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          v-model="keyword"
          type="text"
          class="search-input"
          placeholder="프로필로 검색..."
          @keyup.enter="handleSearch"
        />
      </div>
      <button class="btn-search" @click="handleSearch">검색</button>

      <select v-model="sortType" class="sort-select" @change="fetchList">
        <option value="VIEW">조회순</option>
        <option value="NAME">이름순</option>
      </select>
    </div>

    <!-- 목록 -->
    <div v-if="isLoading" class="loading">불러오는 중...</div>

    <div v-else-if="talents.length === 0" class="empty-state">
      <p class="empty-title">표시할 인재가 없습니다</p>
    </div>

    <div v-else class="talent-list">
      <div
        v-for="talent in talents"
        :key="talent.email"
        class="talent-item"
        @click="goDetail(talent.email)"
      >
        <div class="talent-avatar">
          <img v-if="talent.profileImageUrl" :src="talent.profileImageUrl" />
          <span v-else>{{ talent.name?.charAt(0) }}</span>
        </div>

        <div class="talent-info">
          <p class="talent-name">{{ talent.name }}</p>
          <p class="talent-meta">{{ jobCategoryLabel(talent.jobCategory) }} · 작성일: {{ formatDate(talent.createdAt) }}</p>
        </div>

        <div class="talent-stats">
          <span class="stat">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
            </svg>
            {{ talent.viewCount ?? 0 }}
          </span>
          <span class="stat">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3zM7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3"/>
            </svg>
            {{ talent.likeCount ?? 0 }}
          </span>
        </div>

        <div class="talent-actions" @click.stop>
          <button
            class="btn-bookmark"
            :class="{ active: talent.isBookmarked }"
            @click="toggleBookmark(talent)"
          >
            {{ talent.isBookmarked ? '찜 취소' : '찜하기' }}
          </button>
          <button class="btn-propose" @click="goPropose(talent.email)">제안하기</button>
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
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getTalentList, toggleTalentBookmark } from '@/features/talent/api/talentApi.js'

const router = useRouter()

const activeTab = ref('ALL')  // ALL | DESIGN | IT | MUSIC | EDUCATION | VIDEO | MARKETING | WRITING | ETC | BOOKMARK
import { TALENT_TAB_OPTIONS, jobCategoryLabel } from '@/shared/constants/jobCategory.js'
const jobCategoryTabs = TALENT_TAB_OPTIONS


const sortType = ref('VIEW')       // VIEW | NAME
const keyword = ref('')
const talents = ref([])
const isLoading = ref(false)
const currentPage = ref(1)
const totalPages = ref(1)
const pageSize = 5


function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toISOString().slice(0, 10)
}

async function fetchList() {
    isLoading.value = true
  try {
    const res = await getTalentList({
      keyword: keyword.value,
      jobCategory: (activeTab.value !== 'ALL' && activeTab.value !== 'BOOKMARK') ? activeTab.value : null,
      bookmarked: activeTab.value === 'BOOKMARK',
      sort: sortType.value,
      page: currentPage.value,
      size: pageSize
    })
    const data = res.data.data
    talents.value = data.content || data.list || []
    totalPages.value = data.totalPages || 1
  } catch (err) {
    talents.value = []
  } finally {
    isLoading.value = false
  }
}

function changeTab(value) {
  activeTab.value = value
  currentPage.value = 1
  fetchList()
}

function handleSearch() {
  currentPage.value = 1
  fetchList()
}

function changePage(p) {
  if (p < 1 || p > totalPages.value) return
  currentPage.value = p
  fetchList()
}

async function toggleBookmark(talent) {
  try {
    await toggleTalentBookmark(talent.email)
    talent.isBookmarked = !talent.isBookmarked
  } catch (err) {
    alert('찜하기에 실패했습니다.')
  }
}

function goDetail(email) {
  router.push({ name: 'TalentDetail', params: { id: email } })
}

function goPropose(email) {
  router.push({ name: 'ProposalSelect', query: { freelancerEmail: email } })
}

onMounted(fetchList)
</script>

<style scoped>
.page {
  padding: 32px;
  max-width: 100%;
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  color: #1A233D;
  margin: 0 0 4px;
}

.page-sub {
  font-size: 14px;
  color: #6C757D;
  margin: 0 0 20px;
}

/* 탭 */
.tab-bar {
  display: flex;
  gap: 0;
  border-bottom: 1px solid #E5E7EB;
  margin-bottom: 16px;
  overflow-x: auto;
  white-space: nowrap;
}

.tab-item {
  padding: 10px 16px;
  font-size: 14px;
  font-weight: 500;
  color: #9CA3AF;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  cursor: pointer;
}

.tab-item.active {
  color: #1A233D;
  border-bottom-color: #1A233D;
  font-weight: 600;
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

.search-icon {
  position: absolute;
  left: 12px;
  color: #9CA3AF;
}

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

.btn-search {
  padding: 0 20px;
  height: 40px;
  background: #1A233D;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  flex-shrink: 0;
}

.sort-select {
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

/* 목록 */
.loading, .empty-state {
  text-align: center;
  padding: 60px 0;
  color: #9CA3AF;
}

.talent-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.talent-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  background: white;
  border: 1px solid #E5E7EB;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.15s;
}

.talent-item:hover {
  border-color: #1A233D;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.talent-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: #D1D5DB;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 600;
  color: #6B7280;
  flex-shrink: 0;
  overflow: hidden;
}

.talent-avatar img { width: 100%; height: 100%; object-fit: cover; }

.talent-info { flex: 1; min-width: 0; }

.talent-name {
  font-size: 14px;
  font-weight: 600;
  color: #1A233D;
  margin: 0 0 2px;
}

.talent-meta {
  font-size: 12px;
  color: #9CA3AF;
  margin: 0;
}

.talent-stats {
  display: flex;
  gap: 12px;
  flex-shrink: 0;
}

.stat {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #9CA3AF;
}

.talent-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.btn-bookmark, .btn-propose {
  padding: 6px 14px;
  font-size: 12px;
  font-weight: 500;
  border-radius: 6px;
  cursor: pointer;
  white-space: nowrap;
}

.btn-bookmark {
  background: white;
  color: #6C757D;
  border: 1px solid #E5E7EB;
}

.btn-bookmark.active {
  background: #FEE2E2;
  color: #EF4444;
  border-color: #EF4444;
}

.btn-propose {
  background: #1A233D;
  color: white;
  border: none;
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