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
      <select v-model="sortType" class="sort-select" @change="fetchList">
        <option value="latest">최신 가입순</option>
        <option value="oldest">오래된 가입순</option>
        <option value="name">이름순</option>
      </select>

      <div class="search-input-wrap">
        <svg
          class="search-icon"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          v-model="keyword"
          type="text"
          class="search-input"
          placeholder="이름으로 검색..."
          @keyup.enter="handleSearch"
        />
      </div>
      <button class="btn-search" @click="handleSearch">검색</button>
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
          <p class="talent-meta">
            {{ jobCategoryLabel(talent.jobCategory) }}
          </p>
          <p class="talent-meta">가입일: {{ formatDate(talent.createdAt) }}</p>
        </div>

        <div class="talent-actions" @click.stop>
          <button
            class="btn-bookmark"
            :class="{ active: talent.bookmarked }"
            @click="toggleBookmark(talent)"
          >
            {{ talent.bookmarked ? '찜 취소' : '찜하기' }}
          </button>
          <button class="btn-propose" @click="goPropose(talent.email)">제안하기</button>
        </div>
      </div>
    </div>

    <!-- 페이지네이션 -->
    <div class="pagination">
      <button class="page-btn" :disabled="currentPage === 1" @click="changePage(currentPage - 1)">
        ‹
      </button>
      <button
        v-for="p in totalPages"
        :key="p"
        :class="['page-btn', p === currentPage ? 'active' : '']"
        @click="changePage(p)"
      >
        {{ p }}
      </button>
      <button
        class="page-btn"
        :disabled="currentPage === totalPages"
        @click="changePage(currentPage + 1)"
      >
        ›
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  getTalentList,
  addTalentBookmark,
  removeTalentBookmark,
} from '@/features/talent/api/talentApi.js'

const router = useRouter()

const activeTab = ref('ALL') // ALL | DESIGN | IT | MUSIC | EDUCATION | VIDEO | MARKETING | WRITING | ETC | BOOKMARK
import { TALENT_TAB_OPTIONS, jobCategoryLabel } from '@/shared/constants/jobCategory.js'
const jobCategoryTabs = TALENT_TAB_OPTIONS

const sortType = ref('latest') // VIEW | NAME
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
      jobCategory:
        activeTab.value !== 'ALL' && activeTab.value !== 'BOOKMARK' ? activeTab.value : null,
      bookmarked: activeTab.value === 'BOOKMARK',
      sort: sortType.value,
      page: currentPage.value,
      size: pageSize,
    })
    console.log('응답:', res.data)
    const data = res.data.data
    console.log('data:', data)
    console.log('content:', data.content)
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
    if (talent.bookmarked) {
      await removeTalentBookmark(talent.email)
    } else {
      await addTalentBookmark(talent.email)
    }
    talent.bookmarked = !talent.bookmarked
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
  /* min-height: calc(100vh - 64px); */
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  color: #1a233d;
  margin: 0 0 4px;
}

.page-sub {
  font-size: 14px;
  color: #6c757d;
  margin: 0 0 20px;
}

/* 탭 */
.tab-bar {
  display: flex;
  gap: 0;
  border-bottom: 1px solid #e5e7eb;
  margin-bottom: 16px;
  white-space: nowrap;
}

.tab-item {
  padding: 10px 16px;
  font-size: 14px;
  font-weight: 500;
  color: #9ca3af;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  cursor: pointer;
}

.tab-item.active {
  color: #1a233d;
  border-bottom-color: #1a233d;
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
  color: #9ca3af;
}

.search-input {
  width: 100%;
  height: 40px;
  padding: 0 12px 0 36px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 14px;
  outline: none;
}

.search-input:focus {
  border-color: #1a233d;
}

.btn-search {
  padding: 0 20px;
  height: 40px;
  background: #1a233d;
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
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 14px;
  color: #1a233d;
  background: white;
  cursor: pointer;
  flex-shrink: 0;
}

/* 목록 */
.loading,
.empty-state {
  flex: 1;
  text-align: center;
  padding: 60px 0;
  color: #9ca3af;
}

.talent-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 1;
}

.talent-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.15s;
}

.talent-item:hover {
  border-color: #1a233d;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.talent-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: #d1d5db;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 600;
  color: #6b7280;
  flex-shrink: 0;
  overflow: hidden;
}

.talent-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.talent-info {
  flex: 1;
  min-width: 0;
}

.talent-name {
  font-size: 14px;
  font-weight: 600;
  color: #1a233d;
  margin: 0 0 2px;
}

.talent-meta {
  font-size: 12px;
  color: #9ca3af;
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
  color: #9ca3af;
}

.talent-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.btn-bookmark,
.btn-propose {
  padding: 6px 14px;
  font-size: 12px;
  font-weight: 500;
  border-radius: 6px;
  cursor: pointer;
  white-space: nowrap;
}

.btn-bookmark {
  background: white;
  color: #6c757d;
  border: 1px solid #e5e7eb;
}

.btn-bookmark.active {
  background: #fee2e2;
  color: #ef4444;
  border-color: #ef4444;
}

.btn-propose {
  background: #1a233d;
  color: white;
  border: none;
}

/* 페이지네이션 */
.pagination {
  display: flex;
  justify-content: center;
  gap: 4px;
  margin-top: auto;
  padding-top: 24px;
}

.page-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: none;
  border-radius: 6px;
  font-size: 13px;
  color: #6c757d;
  cursor: pointer;
}

.page-btn:hover:not(:disabled) {
  background: #f3f4f6;
}

.page-btn.active {
  background: #1a233d;
  color: white;
  font-weight: 600;
}

.page-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}
</style>
