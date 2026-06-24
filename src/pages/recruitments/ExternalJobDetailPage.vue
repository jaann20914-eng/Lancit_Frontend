<template>
  <div class="page">
    <div class="top-actions">
      <button type="button" class="back-button" @click="goBack">← 공고 목록</button>
      <div v-if="externalJob" class="recruitment-actions">
        <a
          v-if="externalJob.sourceUrl"
          class="source-button"
          :href="externalJob.sourceUrl"
          target="_blank"
          rel="noopener noreferrer"
        >
          {{ externalJob.sourceButtonLabel || '사이트에서 확인' }}
        </a>
        <button v-else type="button" class="source-button disabled" disabled>원문 없음</button>
      </div>
    </div>

    <div v-if="isLoading" class="state-card">
      <span class="spinner" aria-hidden="true"></span>
      <p>외부 공고 정보를 불러오고 있습니다.</p>
    </div>

    <div v-else-if="errorMessage" class="state-card error-state">
      <p>{{ errorMessage }}</p>
      <button type="button" class="retry-button" @click="loadExternalJob">다시 시도</button>
    </div>

    <article v-else-if="externalJob" class="detail-card">
      <header class="detail-heading">
        <div class="badge-row">
          <span class="category-badge">{{ externalJob.jobCategoryRaw || '외부 공고' }}</span>
          <span v-if="externalJob.employmentTypeRaw" class="category-badge light">
            {{ externalJob.employmentTypeRaw }}
          </span>
          <span
            v-if="externalJob.recommendationLabel"
            :class="['status-badge', 'heading-status', externalJob.recommendationClassName]"
          >
            {{ externalJob.recommendationLabel }}
          </span>
        </div>
        <p class="company-name">{{ externalJob.companyName || '기관 정보 없음' }}</p>
        <h1>{{ externalJob.title || '제목 없는 공고' }}</h1>
        <p class="summary">{{ externalJob.summary || '등록된 요약이 없습니다.' }}</p>
      </header>

      <dl class="information-grid">
        <div>
          <dt>급여/보수</dt>
          <dd>{{ externalJob.salaryText || '협의' }}</dd>
        </div>
        <div>
          <dt>근무 위치</dt>
          <dd>{{ externalJob.workLocation || externalJob.location || '협의' }}</dd>
        </div>
        <div>
          <dt>모집 기간</dt>
          <dd>{{ formatPeriod(externalJob.recruitmentStartAt, externalJob.recruitmentEndAt) }}</dd>
        </div>
        <div>
          <dt>고용 형태</dt>
          <dd>{{ externalJob.employmentTypeRaw || '미정' }}</dd>
        </div>
        <div>
          <dt>출처</dt>
          <dd>{{ externalJob.sourceLabel || '외부 사이트' }}</dd>
        </div>
        <div>
          <dt>수집일</dt>
          <dd>{{ formatDate(externalJob.collectedAt || externalJob.createdAt) }}</dd>
        </div>
      </dl>

      <section class="detail-section">
        <h2>공고 내용</h2>
        <p class="content">{{ externalJob.content || '등록된 상세 내용이 없습니다.' }}</p>
      </section>

      <section v-if="externalJob.requirements" class="detail-section">
        <h2>자격 및 조건</h2>
        <p class="content">{{ externalJob.requirements }}</p>
      </section>

      <section class="detail-section">
        <h2>원문 확인</h2>
        <p class="content">{{ externalJob.externalNotice }}</p>
      </section>

      <footer class="detail-footer">
        <span>최근 수정 {{ formatDateTime(externalJob.updatedAt) }}</span>
        <span class="application-state available">지원은 원문 사이트에서 진행합니다.</span>
      </footer>
    </article>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getExternalJob } from '@/features/externalJobs/api/externalJobApi.js'
import {
  formatDate,
  formatDateTime,
} from '@/features/company/recruitments/api/companyRecruitmentMapper.js'

const route = useRoute()
const router = useRouter()

const externalJob = ref(null)
const isLoading = ref(true)
const errorMessage = ref('')

watch(() => route.params.externalJobId, loadExternalJob, { immediate: true })

async function loadExternalJob() {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const data = await getExternalJob(route.params.externalJobId)
    if (!data) throw new Error('Invalid external job response')
    externalJob.value = data
  } catch (error) {
    externalJob.value = null
    errorMessage.value = getExternalJobError(
      error,
      '외부 공고 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.',
    )
  } finally {
    isLoading.value = false
  }
}

function formatPeriod(start, end) {
  if (!start && !end) return '미정'
  return `${start ? formatDate(start) : '미정'} ~ ${end ? formatDate(end) : '미정'}`
}

function goBack() {
  router.push({ name: 'RecruitmentList', query: { tab: 'EXTERNAL' } })
}

function getExternalJobError(error, fallback) {
  const status = error?.response?.status
  if (status === 401) return '로그인이 만료되었습니다. 다시 로그인해주세요.'
  if (status === 403) return '외부 공고를 조회할 권한이 없습니다.'
  if (status === 404) return '요청한 외부 공고를 찾을 수 없습니다.'

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
.source-button,
.retry-button {
  min-height: 38px;
  padding: 0 13px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  color: #4b5563;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
}
.source-button {
  border-color: #1a233d;
  background: #1a233d;
  color: white;
}
.source-button.disabled {
  border-color: #d1d5db;
  background: #e5e7eb;
  color: #9ca3af;
  cursor: not-allowed;
}
.detail-card,
.state-card {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: white;
  overflow: hidden;
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
.category-badge {
  min-height: 26px;
  padding: 0 10px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  font-size: 11px;
  font-weight: 600;
}
.recommendation-high {
  background: #fef3c7;
  color: #92400e;
}
.recommendation-recommended {
  background: #dcfce7;
  color: #15803d;
}
.recommendation-possible,
.recommendation-unknown {
  background: #e0f2fe;
  color: #0369a1;
}
.category-badge {
  background: #e8edf5;
  color: #1a233d;
}
.category-badge.light {
  background: #f3f4f6;
  color: #6b7280;
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
    grid-template-columns: 1fr;
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
