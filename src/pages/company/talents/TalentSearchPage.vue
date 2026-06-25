<template>
  <div class="page">
    <header class="page-header">
      <div>
        <h1 class="page-title">인재 찾기</h1>
        <p class="page-description page-sub">다양한 프리랜서를 찾아보세요</p>
      </div>
    </header>

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
    <BaseFilterBar aria-label="인재 검색 및 정렬">
      <BaseSelect v-model="sortType" aria-label="정렬 방식" @change="fetchList">
        <option value="latest">최신 가입순</option>
        <option value="oldest">오래된 가입순</option>
        <option value="name">이름순</option>
      </BaseSelect>

      <BaseSearchInput
        v-model="keyword"
        type="text"
        placeholder="이름으로 검색..."
        aria-label="인재 검색어"
        @search="handleSearch"
      />
      <BaseButton @click="handleSearch">검색</BaseButton>
    </BaseFilterBar>

    <!-- 목록 -->
    <div v-if="isLoading" class="loading">불러오는 중...</div>

    <!-- 변경 -->
    <div v-else-if="talents.length === 0" class="empty-state">
      <div class="empty-icon-wrap">
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#c0c6d4"
          stroke-width="1.5"
        >
          <circle cx="11" cy="8" r="4" />
          <path d="M3 20c0-4 3.6-7 8-7s8 3 8 7" />
        </svg>
      </div>
      <p class="empty-title">검색된 인재가 없습니다.</p>
      <p class="empty-sub">다른 키워드나 카테고리로 검색해보세요.</p>
    </div>

    <div v-else class="talent-list">
      <div
        v-for="talent in talents"
        :key="talent.email"
        class="talent-item"
        role="link"
        tabindex="0"
        @click="goDetail(talent.email)"
        @keydown.enter.prevent="goDetail(talent.email)"
        @keydown.space.prevent="goDetail(talent.email)"
      >
        <!-- 아바타 -->
        <div class="talent-avatar">
          <img v-if="talent.profileImageUrl" :src="talent.profileImageUrl" />
          <span v-else>{{ (talent.displayName || talent.name)?.charAt(0) }}</span>
        </div>

        <!-- 정보 -->
        <div class="talent-info">
          <div class="talent-name-row">
            <p class="talent-name">{{ talent.displayName || talent.name }}</p>
            <span class="talent-category">{{ jobCategoryLabel(talent.jobCategory) }}</span>
          </div>
          <p v-if="talent.shortIntro" class="talent-intro">{{ talent.shortIntro }}</p>
          <p v-else class="talent-intro muted">소개글이 없습니다.</p>
          <p v-if="talent.description" class="talent-desc">{{ talent.description }}</p>
          <p class="talent-meta">가입일: {{ formatDate(talent.createdAt) }}</p>
        </div>

        <!-- 액션 -->
        <div class="talent-actions" @click.stop @keydown.stop>
          <BaseButton
            size="sm"
            :variant="talent.bookmarked ? 'danger' : 'outline'"
            @click="toggleBookmark(talent)"
          >
            {{ talent.bookmarked ? '찜 취소' : '찜하기' }}
          </BaseButton>
          <BaseButton size="sm" @click="goPropose(talent.email)">제안하기</BaseButton>
        </div>
      </div>
    </div>

    <!-- 페이지네이션 -->
    <BasePagination
      :current-page="currentPage"
      :total-pages="totalPages"
      :total-elements="totalElements"
      :page-size="pageSize"
      :disabled="isLoading"
      @change="changePage"
    />
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
import BaseButton from '@/shared/ui/BaseButton.vue'
import BaseFilterBar from '@/shared/ui/BaseFilterBar.vue'
import BasePagination from '@/shared/ui/BasePagination.vue'
import BaseSearchInput from '@/shared/ui/BaseSearchInput.vue'
import BaseSelect from '@/shared/ui/BaseSelect.vue'

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
const totalElements = ref(0)
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
    totalElements.value = Number(data.totalElements ?? data.totalCount ?? talents.value.length)
  } catch (err) {
    talents.value = []
    totalElements.value = 0
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
  padding: var(--lancit-page-padding);
  max-width: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.page-header {
  margin-bottom: var(--lancit-page-header-margin);
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  color: #1a233d;
  margin: 0 0 4px;
  line-height: 1.3;
}

.page-sub {
  font-size: 14px;
  color: var(--lancit-page-description-color);
  margin: 0;
  line-height: 1.5;
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

/* 로딩 */
.loading {
  flex: 1;
  text-align: center;
  padding: 60px 0;
  color: #9ca3af;
}

/* 빈 상태 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
  flex: 1;
  text-align: center;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #ffffff;
}

.empty-icon-wrap {
  width: 80px;
  height: 80px;
  background: #f3f4f6;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
}

.empty-title {
  font-size: 17px;
  font-weight: 700;
  color: #1a233d;
  margin: 0 0 8px;
}

.empty-sub {
  font-size: 13.5px;
  color: #9ca3af;
  margin: 0;
}

/* 목록 */
.talent-list {
  display: flex;
  flex-direction: column;
  gap: var(--lancit-list-gap);
  flex: 1;
}

/* 카드 */
.talent-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.15s;
}

.talent-item:hover,
.talent-item:focus-visible {
  border-color: #1a233d;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  transform: translateY(-1px);
  outline: none;
}

.talent-avatar {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: #e8edf5;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 700;
  color: #1a233d;
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
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.talent-name-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.talent-name {
  font-size: 15px;
  font-weight: 700;
  color: #1a233d;
  margin: 0;
}

.talent-category {
  font-size: 11px;
  font-weight: 600;
  color: #1d4ed8;
  background: #dbeafe;
  padding: 2px 8px;
  border-radius: 999px;
  flex-shrink: 0;
}

.talent-intro {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  margin: 0;
}

.talent-intro.muted {
  color: #d1d5db;
  font-weight: 400;
}

.talent-desc {
  font-size: 12px;
  color: #6b7280;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.talent-meta {
  font-size: 11px;
  color: #9ca3af;
  margin: 0;
}

.talent-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

/* 페이지네이션 */
.pagination {
  display: flex;
  justify-content: center;
  gap: 4px;
  margin-top: auto;
  padding-top: 24px;
}

@media (max-width: 800px) {
  .page {
    padding: var(--lancit-page-mobile-padding);
  }
}
</style>
