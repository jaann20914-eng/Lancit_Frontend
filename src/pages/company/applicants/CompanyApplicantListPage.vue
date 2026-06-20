<template>
  <div class="page">
    <header class="page-header">
      <div>
        <button type="button" class="back-link" @click="goToRecruitment">← 공고 상세</button>
        <h1>지원자 관리</h1>
        <p>{{ recruitmentTitle || '공고' }}에 지원한 프리랜서를 확인합니다.</p>
      </div>
    </header>

    <div v-if="isLoading" class="state-card">
      <span class="spinner" aria-hidden="true"></span>
      <p>지원자 목록을 불러오고 있습니다.</p>
    </div>

    <div v-else-if="errorMessage" class="state-card error-state">
      <p>{{ errorMessage }}</p>
      <button type="button" class="retry-button" @click="loadApplications">다시 시도</button>
    </div>

    <section v-else-if="!applications.length" class="empty-state">
      <div class="empty-icon" aria-hidden="true">♙</div>
      <h2>아직 지원자가 없습니다.</h2>
      <p>새로운 지원자가 생기면 이곳에서 확인할 수 있습니다.</p>
      <button type="button" class="secondary-button" @click="goToRecruitment">공고로 돌아가기</button>
    </section>

    <template v-else>
      <div class="list-summary">
        <span>총 {{ pagination.totalElements.toLocaleString('ko-KR') }}명</span>
        <span class="view-note">상세 보기를 열면 최초 열람 시간이 기록됩니다.</span>
      </div>

      <div class="application-list">
        <article v-for="application in applications" :key="application.applicationId" class="application-card">
          <div class="applicant-avatar" aria-hidden="true">{{ getInitial(application) }}</div>
          <div class="applicant-main">
            <div class="name-row">
              <h2>{{ application.applicantName || '이름 미등록' }}</h2>
              <span v-if="!application.viewedAt" class="new-badge">NEW</span>
              <span :class="['status-badge', application.statusMeta.className]">{{ application.statusMeta.label }}</span>
            </div>
            <p class="email">{{ application.applicantEmail }}</p>
            <p class="intro">{{ application.intro || '등록된 지원 소개가 없습니다.' }}</p>
            <div class="meta-row">
              <span>지원일 {{ formatDateTime(application.appliedAt) }}</span>
              <span>포트폴리오 {{ application.portfolios.length }}개</span>
              <span>{{ application.viewedAt ? `열람 ${formatDateTime(application.viewedAt)}` : '미열람' }}</span>
            </div>
          </div>
          <button type="button" class="detail-button" @click="goToDetail(application.applicationId)">상세 보기</button>
        </article>
      </div>

      <nav v-if="pagination.totalPages > 1" class="pagination" aria-label="지원자 목록 페이지">
        <button type="button" :disabled="!pagination.hasPrev" @click="changePage(pagination.page - 1)">이전</button>
        <span>{{ pagination.page }} / {{ pagination.totalPages }}</span>
        <button type="button" :disabled="!pagination.hasNext" @click="changePage(pagination.page + 1)">다음</button>
      </nav>
    </template>
  </div>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getCompanyApplications } from '@/features/company/applicants/api/companyApplicationApi.js'
import { getCompanyRecruitment } from '@/features/company/recruitments/api/companyRecruitmentApi.js'
import { getCompanyApiError } from '@/features/company/recruitments/api/companyRecruitmentError.js'
import { formatDateTime } from '@/features/company/recruitments/api/companyRecruitmentMapper.js'

const route = useRoute()
const router = useRouter()

const applications = ref([])
const recruitmentTitle = ref('')
const isLoading = ref(true)
const errorMessage = ref('')
const pagination = reactive({ page: 1, size: 10, totalElements: 0, totalPages: 0, hasNext: false, hasPrev: false })
const recruitmentId = () => route.params.recruitmentId

watch(() => recruitmentId(), loadApplications, { immediate: true })

async function loadApplications() {
  isLoading.value = true
  errorMessage.value = ''
  try {
    const [pageData, recruitment] = await Promise.all([
      getCompanyApplications(recruitmentId(), { page: pagination.page, size: pagination.size }),
      getCompanyRecruitment(recruitmentId()),
    ])
    applications.value = pageData.content
    recruitmentTitle.value = recruitment?.title ?? ''
    Object.assign(pagination, {
      page: pageData.page,
      size: pageData.size,
      totalElements: pageData.totalElements,
      totalPages: pageData.totalPages,
      hasNext: pageData.hasNext,
      hasPrev: pageData.hasPrev,
    })
  } catch (error) {
    applications.value = []
    errorMessage.value = getCompanyApiError(error, '지원자 목록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.')
  } finally {
    isLoading.value = false
  }
}

function getInitial(application) {
  return (application.applicantName || application.applicantEmail || '?').trim().slice(0, 1).toUpperCase()
}

function changePage(page) {
  pagination.page = page
  loadApplications()
}

function goToRecruitment() {
  router.push({ name: 'CompanyRecruitmentDetail', params: { recruitmentId: recruitmentId() } })
}

function goToDetail(applicationId) {
  router.push({ name: 'CompanyApplicantDetail', params: { recruitmentId: recruitmentId(), applicationId } })
}
</script>

<style scoped>
.page { width: 100%; max-width: 1000px; margin: 0 auto; padding: 32px; color: #1f2937; }
.page-header { margin-bottom: 24px; }
.back-link { margin: 0 0 14px; padding: 0; border: 0; background: none; color: #6b7280; font-size: 13px; cursor: pointer; }
.back-link:hover { color: #1a233d; }
.page-header h1 { margin: 0 0 6px; color: #1a233d; font-size: 24px; }
.page-header p { margin: 0; color: #6b7280; font-size: 14px; }
.list-summary { margin-bottom: 11px; display: flex; justify-content: space-between; gap: 14px; color: #6b7280; font-size: 12px; }
.view-note { color: #9ca3af; }
.application-list { display: grid; gap: 12px; }
.application-card { padding: 22px; border: 1px solid #e5e7eb; border-radius: 11px; background: white; display: grid; grid-template-columns: auto minmax(0,1fr) auto; align-items: center; gap: 18px; }
.applicant-avatar { width: 46px; height: 46px; border-radius: 50%; background: #e8edf5; color: #1a233d; display: grid; place-items: center; font-size: 16px; font-weight: 700; }
.name-row { display: flex; align-items: center; flex-wrap: wrap; gap: 7px; }
.name-row h2 { margin: 0; color: #1a233d; font-size: 16px; }
.new-badge, .status-badge { min-height: 22px; padding: 0 8px; border-radius: 999px; display: inline-flex; align-items: center; font-size: 10px; font-weight: 700; }
.new-badge { background: #dbeafe; color: #1d4ed8; }
.status-pending { background: #fef9c3; color: #92400e; }
.status-accepted { background: #dcfce7; color: #15803d; }
.status-rejected, .status-cancelled, .status-unknown { background: #fee2e2; color: #991b1b; }
.email { margin: 4px 0 10px; color: #9ca3af; font-size: 11px; }
.intro { margin: 0 0 11px; color: #4b5563; font-size: 13px; line-height: 1.55; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.meta-row { display: flex; flex-wrap: wrap; gap: 14px; color: #9ca3af; font-size: 11px; }
.detail-button, .secondary-button, .retry-button { min-height: 38px; padding: 0 14px; border: 1px solid #1a233d; border-radius: 6px; background: white; color: #1a233d; font-size: 12px; font-weight: 600; cursor: pointer; }
.state-card, .empty-state { min-height: 340px; padding: 40px; border: 1px solid #e5e7eb; border-radius: 12px; background: white; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
.state-card { color: #6b7280; }
.state-card p { margin: 14px 0 0; }
.error-state { color: #b91c1c; }
.retry-button { margin-top: 18px; border-color: #d1d5db; color: #4b5563; }
.empty-icon { width: 48px; height: 48px; margin-bottom: 15px; border-radius: 50%; background: #e8edf5; color: #1a233d; display: grid; place-items: center; font-size: 22px; }
.empty-state h2 { margin: 0 0 8px; color: #1a233d; font-size: 18px; }
.empty-state p { margin: 0 0 22px; color: #6b7280; font-size: 13px; }
.spinner { width: 28px; height: 28px; border: 3px solid #dce2eb; border-top-color: #1a233d; border-radius: 50%; animation: spin .8s linear infinite; }
.pagination { margin-top: 22px; display: flex; align-items: center; justify-content: center; gap: 14px; color: #6b7280; font-size: 13px; }
.pagination button { height: 34px; padding: 0 13px; border: 1px solid #d1d5db; border-radius: 6px; background: white; color: #374151; cursor: pointer; }
.pagination button:disabled { opacity: .4; cursor: not-allowed; }
@keyframes spin { to { transform: rotate(360deg); } }
@media (max-width: 700px) { .page { padding: 24px 18px; } .application-card { grid-template-columns: auto 1fr; } .detail-button { grid-column: 1 / -1; } .list-summary { flex-direction: column; } }
</style>
