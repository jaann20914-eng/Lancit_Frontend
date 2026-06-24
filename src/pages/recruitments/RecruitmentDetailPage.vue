<template>
  <div class="page">
    <div class="top-actions">
      <button type="button" class="back-button" @click="goBack">← {{ backButtonText }}</button>
      <div v-if="recruitment" class="recruitment-actions">
        <button
          type="button"
          :class="['bookmark-button', { bookmarked: recruitment.isBookmarked }]"
          :aria-label="recruitment.isBookmarked ? '찜 해제' : '찜하기'"
          :aria-pressed="recruitment.isBookmarked"
          :disabled="isBookmarking"
          @click="handleBookmark"
        >
          <span aria-hidden="true">{{ recruitment.isBookmarked ? '♥' : '♡' }}</span>
          {{ isBookmarking ? '처리 중' : recruitment.isBookmarked ? '찜됨' : '찜' }}
        </button>
        <button
          type="button"
          class="apply-button"
          :disabled="!recruitment.isApplied && !recruitment.canApply"
          @click="handleApplicationAction"
        >
          {{
            recruitment.isApplied ? '지원서 보기' : recruitment.canApply ? '지원하기' : '지원 불가'
          }}
        </button>
      </div>
    </div>

    <div v-if="isLoading" class="state-card">
      <span class="spinner" aria-hidden="true"></span>
      <p>공고 정보를 불러오고 있습니다.</p>
    </div>

    <div v-else-if="errorMessage" class="state-card error-state">
      <p>{{ errorMessage }}</p>
      <button type="button" class="retry-button" @click="loadRecruitment">다시 시도</button>
    </div>

    <article v-else-if="recruitment" class="detail-card">
      <img
        v-if="imageUrl"
        :src="imageUrl"
        :alt="`${recruitment.title || '채용 공고'} 이미지`"
        class="cover-image"
      />

      <header class="detail-heading">
        <div class="badge-row">
          <span class="category-badge">{{ recruitment.jobCategoryLabel }}</span>
          <span class="category-badge light">{{ recruitment.recruitmentCategoryLabel }}</span>
          <span v-if="recruitment.isApplied" class="applied-badge">지원 완료</span>
          <span :class="['status-badge', 'heading-status', recruitment.statusMeta.className]">
            {{ recruitment.statusMeta.label }}
          </span>
        </div>
        <p class="company-name">{{ recruitment.companyName || '기업 정보 없음' }}</p>
        <h1>{{ recruitment.title || '제목 없는 공고' }}</h1>
        <p class="summary">{{ recruitment.summary || '등록된 요약이 없습니다.' }}</p>
      </header>

      <dl class="information-grid">
        <div>
          <dt>예산</dt>
          <dd>{{ formatBudget(recruitment.budget) }}</dd>
        </div>
        <div>
          <dt>근무 위치</dt>
          <dd>{{ recruitment.workLocation || '협의' }}</dd>
        </div>
        <div>
          <dt>모집 기간</dt>
          <dd>{{ formatPeriod(recruitment.recruitmentStartAt, recruitment.recruitmentEndAt) }}</dd>
        </div>
        <div>
          <dt>예상 계약 기간</dt>
          <dd>{{ formatPeriod(recruitment.contractStartAt, recruitment.contractEndAt) }}</dd>
        </div>
        <div>
          <dt>지원자 수</dt>
          <dd>{{ recruitment.applicantCount.toLocaleString('ko-KR') }}명</dd>
        </div>
        <div>
          <dt>등록일</dt>
          <dd>{{ formatDate(recruitment.createdAt) }}</dd>
        </div>
      </dl>

      <section v-if="recruitment.techStacks.length" class="detail-section">
        <h2>기술 스택</h2>
        <div class="tech-stack-row">
          <span v-for="techStack in recruitment.techStacks" :key="techStack" class="tech-tag">
            {{ techStack }}
          </span>
        </div>
      </section>

      <section class="detail-section">
        <h2>공고 내용</h2>
        <p class="content">{{ recruitment.content || '등록된 상세 내용이 없습니다.' }}</p>
      </section>

      <section v-if="recruitment.requirements" class="detail-section">
        <h2>요구사항</h2>
        <p class="content">{{ recruitment.requirements }}</p>
      </section>

      <footer class="detail-footer">
        <span>최근 수정 {{ formatDateTime(recruitment.updatedAt) }}</span>
        <span v-if="recruitment.isApplied" class="application-state applied">
          이미 지원한 공고입니다.
        </span>
        <span v-else-if="recruitment.canApply" class="application-state available">
          현재 지원할 수 있는 공고입니다.
        </span>
        <span v-else class="application-state">현재 지원할 수 없는 공고입니다.</span>
      </footer>
    </article>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  getRecruitment,
  getRecruitmentFileUrl,
  toggleRecruitmentBookmark,
} from '@/features/recruitments/api/recruitmentApi.js'
import {
  formatBudget,
  formatDate,
  formatDateTime,
} from '@/features/company/recruitments/api/companyRecruitmentMapper.js'

const route = useRoute()
const router = useRouter()

const recruitment = ref(null)
const imageUrl = ref('')
const isLoading = ref(true)
const isBookmarking = ref(false)
const errorMessage = ref('')

watch(() => route.params.id, loadRecruitment, { immediate: true })

async function loadRecruitment() {
  isLoading.value = true
  errorMessage.value = ''
  imageUrl.value = ''

  try {
    const data = await getRecruitment(route.params.id)
    if (!data) throw new Error('Invalid recruitment response')
    recruitment.value = data

    if (data.imageFileId !== null && data.imageFileId !== undefined) {
      try {
        imageUrl.value = await getRecruitmentFileUrl(data.imageFileId)
      } catch {
        imageUrl.value = ''
      }
    }
  } catch (error) {
    recruitment.value = null
    errorMessage.value = getRecruitmentError(
      error,
      '공고 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.',
    )
  } finally {
    isLoading.value = false
  }
}

async function handleBookmark() {
  if (!recruitment.value || isBookmarking.value) return

  isBookmarking.value = true
  try {
    const result = await toggleRecruitmentBookmark(recruitment.value.recruitmentId)
    recruitment.value.isBookmarked =
      typeof result?.isBookmarked === 'boolean'
        ? result.isBookmarked
        : !recruitment.value.isBookmarked
  } catch (error) {
    alert(getRecruitmentError(error, '찜 상태를 변경하지 못했습니다. 잠시 후 다시 시도해주세요.'))
  } finally {
    isBookmarking.value = false
  }
}

const backButtonText = computed(() => {
  switch (route.query.from) {
    case 'proposal':
      return '제안 목록'

    case 'bookmark':
      return '찜 목록'

    default:
      return '공고 목록'
  }
})

function formatPeriod(start, end) {
  if (!start && !end) return '미정'
  return `${start ? formatDate(start) : '미정'} ~ ${end ? formatDate(end) : '미정'}`
}

function goBack() {
  switch (route.query.from) {
    case 'proposal':
      router.push({ name: 'ProposalList' })
      break

    case 'bookmark':
      router.push({ name: 'BookmarkList' })
      break

    default:
      router.push({ name: 'RecruitmentList' })
  }
}

function handleApplicationAction() {
  if (recruitment.value?.isApplied) {
    router.push({
      name: 'ApplicationDetail',
      params: { id: recruitment.value.recruitmentId },
    })
    return
  }
  if (!recruitment.value?.canApply) return
  router.push({
    name: 'RecruitmentApply',
    params: { recruitmentId: recruitment.value.recruitmentId },
  })
}

function getRecruitmentError(error, fallback) {
  const status = error?.response?.status
  if (status === 401) return '로그인이 만료되었습니다. 다시 로그인해주세요.'
  if (status === 403) return '공고를 조회할 권한이 없습니다.'
  if (status === 404) return '요청한 공고를 찾을 수 없습니다.'

  const message = error?.response?.data?.message
  return typeof message === 'string' && message.trim() ? message : fallback
}
</script>

<style scoped>
.page {
  width: 100%;
  max-width: 1000px;
  margin: 0 auto;
  padding: 32px;
  color: #1f2937;
}
.top-actions {
  margin-bottom: 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}
.recruitment-actions {
  display: flex;
  gap: 8px;
}
.back-button,
.bookmark-button,
.apply-button,
.retry-button {
  min-height: 38px;
  padding: 0 13px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  color: #4b5563;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}
.apply-button {
  border-color: #1a233d;
  background: #1a233d;
  color: white;
}
.apply-button:disabled {
  border-color: #d1d5db;
  background: #e5e7eb;
  color: #9ca3af;
  cursor: not-allowed;
}
.bookmark-button span {
  margin-right: 3px;
  font-size: 16px;
}
.bookmark-button.bookmarked {
  border-color: #fda4af;
  background: #fff1f2;
  color: #e11d48;
}
.bookmark-button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
.detail-card,
.state-card {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: white;
  overflow: hidden;
}
.cover-image {
  width: 100%;
  max-height: 340px;
  object-fit: cover;
  display: block;
}
.detail-heading {
  padding: 32px;
  border-bottom: 1px solid #e5e7eb;
}
.badge-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 7px;
}
.heading-status {
  margin-left: auto;
}
.status-badge,
.category-badge,
.applied-badge,
.tech-tag {
  min-height: 26px;
  padding: 0 10px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  font-size: 11px;
  font-weight: 600;
}
.status-open {
  background: #dcfce7;
  color: #15803d;
}
.status-closed,
.status-expired {
  background: #f3f4f6;
  color: #4b5563;
}
.status-cancelled,
.status-unknown {
  background: #fee2e2;
  color: #991b1b;
}
.category-badge {
  background: #e8edf5;
  color: #1a233d;
}
.category-badge.light {
  background: #f3f4f6;
  color: #6b7280;
}
.applied-badge {
  background: #ede9fe;
  color: #6d28d9;
}
.company-name {
  margin: 18px 0 5px;
  color: #6b7280;
  font-size: 13px;
  font-weight: 600;
}
.detail-heading h1 {
  margin: 0 0 8px;
  color: #1a233d;
  font-size: 28px;
  line-height: 1.35;
}
.summary {
  margin: 0;
  color: #4b5563;
  font-size: 15px;
  line-height: 1.6;
}
.information-grid {
  margin: 0;
  padding: 24px 32px;
  border-bottom: 1px solid #e5e7eb;
  background: #fafafa;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 20px;
}
.information-grid dt {
  margin-bottom: 5px;
  color: #9ca3af;
  font-size: 11px;
}
.information-grid dd {
  margin: 0;
  color: #374151;
  font-size: 13px;
  font-weight: 600;
  overflow-wrap: anywhere;
}
.detail-section {
  padding: 28px 32px;
  border-bottom: 1px solid #e5e7eb;
}
.detail-section h2 {
  margin: 0 0 15px;
  color: #1a233d;
  font-size: 17px;
}
.content {
  margin: 0;
  color: #4b5563;
  font-size: 14px;
  line-height: 1.85;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
.tech-stack-row {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
}
.tech-tag {
  background: #f0f4f9;
  color: #4a6fa5;
  font-weight: 500;
}
.detail-footer {
  padding: 17px 32px;
  color: #9ca3af;
  font-size: 11px;
  display: flex;
  justify-content: space-between;
  gap: 12px;
}
.application-state {
  color: #6b7280;
}
.application-state.available {
  color: #047857;
  font-weight: 600;
}
.application-state.applied {
  color: #6d28d9;
  font-weight: 600;
}
.state-card {
  min-height: 350px;
  padding: 40px;
  color: #6b7280;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}
.state-card p {
  margin: 14px 0 0;
}
.error-state {
  color: #b91c1c;
}
.retry-button {
  margin-top: 18px;
}
.spinner {
  width: 28px;
  height: 28px;
  border: 3px solid #dce2eb;
  border-top-color: #1a233d;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
@media (max-width: 760px) {
  .page {
    padding: 24px 18px;
  }
  .information-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .detail-heading,
  .detail-section {
    padding: 24px;
  }
  .top-actions {
    align-items: stretch;
    flex-direction: column;
  }
  .recruitment-actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }
}
@media (max-width: 480px) {
  .information-grid {
    grid-template-columns: 1fr;
  }
  .detail-footer {
    flex-direction: column;
  }
}
</style>
