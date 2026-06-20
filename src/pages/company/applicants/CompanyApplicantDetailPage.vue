<template>
  <div class="page">
    <div class="top-actions">
      <button type="button" class="back-button" @click="goToList">← 지원자 목록</button>
      <div v-if="application?.status === 'PENDING'" class="decision-actions">
        <button type="button" class="reject-button" :disabled="isUpdating" @click="handleDecision('REJECTED')">지원 거절</button>
        <button type="button" class="accept-button" :disabled="isUpdating" @click="handleDecision('ACCEPTED')">지원 수락</button>
      </div>
    </div>

    <div v-if="isLoading" class="state-card">
      <span class="spinner" aria-hidden="true"></span>
      <p>지원 정보를 불러오고 있습니다.</p>
    </div>

    <div v-else-if="errorMessage" class="state-card error-state">
      <p>{{ errorMessage }}</p>
      <button type="button" class="retry-button" @click="loadApplication">다시 시도</button>
    </div>

    <template v-else-if="application">
      <article class="profile-card">
        <div class="profile-heading">
          <div class="avatar" aria-hidden="true">{{ applicantInitial }}</div>
          <div class="identity">
            <div class="name-row">
              <h1>{{ application.applicantName || application.portfolioProfile?.name || '이름 미등록' }}</h1>
              <span :class="['status-badge', application.statusMeta.className]">{{ application.statusMeta.label }}</span>
            </div>
            <p>{{ application.applicantEmail }}</p>
          </div>
        </div>

        <dl class="application-meta">
          <div><dt>지원 공고</dt><dd>{{ application.recruitmentTitle || '공고명 미등록' }}</dd></div>
          <div><dt>지원일</dt><dd>{{ formatDateTime(application.appliedAt) }}</dd></div>
          <div><dt>열람일</dt><dd>{{ formatDateTime(application.viewedAt) }}</dd></div>
          <div><dt>계약</dt><dd>{{ application.contractId ? `계약 #${application.contractId}` : '없음' }}</dd></div>
        </dl>

        <section class="content-section">
          <h2>지원 소개</h2>
          <p class="long-text">{{ application.intro || '등록된 지원 소개가 없습니다.' }}</p>
        </section>
      </article>

      <article v-if="application.portfolioProfile" class="profile-card">
        <section class="content-section profile-intro">
          <div class="section-title-row">
            <h2>포트폴리오 프로필</h2>
            <span>{{ application.portfolioProfile.jobCategoryLabel }}</span>
          </div>
          <p class="long-text">{{ application.portfolioProfile.intro || '등록된 프로필 소개가 없습니다.' }}</p>
          <div v-if="application.portfolioProfile.techStacks.length" class="tech-stack-row">
            <span v-for="techStack in application.portfolioProfile.techStacks" :key="techStack" class="tech-tag">{{ techStack }}</span>
          </div>
        </section>
      </article>

      <article class="profile-card">
        <section class="content-section">
          <div class="section-title-row">
            <h2>제출 포트폴리오</h2>
            <span>{{ application.portfolios.length }}개</span>
          </div>
          <div v-if="application.portfolios.length" class="portfolio-grid">
            <div v-for="portfolio in application.portfolios" :key="portfolio.portfolioId" class="portfolio-item">
              <span class="portfolio-category">{{ getRecruitmentCategoryLabel(portfolio.category) }}</span>
              <h3>{{ portfolio.title || '제목 없는 프로젝트' }}</h3>
              <p>{{ portfolio.summary || '등록된 요약이 없습니다.' }}</p>
            </div>
          </div>
          <p v-else class="empty-note">제출된 포트폴리오가 없습니다.</p>
        </section>
      </article>

      <p v-if="application.status === 'ACCEPTED'" class="decision-note success">지원 수락과 함께 대기 상태의 계약이 생성되었습니다.</p>
      <p v-else-if="application.status === 'REJECTED'" class="decision-note rejected">거절 처리된 지원입니다.</p>
    </template>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  getCompanyApplication,
  updateCompanyApplicationStatus,
} from '@/features/company/applicants/api/companyApplicationApi.js'
import { getCompanyApiError } from '@/features/company/recruitments/api/companyRecruitmentError.js'
import {
  formatDateTime,
  getRecruitmentCategoryLabel,
} from '@/features/company/recruitments/api/companyRecruitmentMapper.js'

const route = useRoute()
const router = useRouter()

const application = ref(null)
const isLoading = ref(true)
const isUpdating = ref(false)
const errorMessage = ref('')
const recruitmentId = () => route.params.recruitmentId
const applicationId = () => route.params.applicationId ?? route.params.id
const applicantInitial = computed(() => (application.value?.applicantName || application.value?.applicantEmail || '?').trim().slice(0, 1).toUpperCase())

watch([() => recruitmentId(), () => applicationId()], loadApplication, { immediate: true })

async function loadApplication() {
  isLoading.value = true
  errorMessage.value = ''
  try {
    const data = await getCompanyApplication(recruitmentId(), applicationId())
    if (!data) throw new Error('Invalid application response')
    application.value = data
  } catch (error) {
    application.value = null
    errorMessage.value = getCompanyApiError(error, '지원 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.')
  } finally {
    isLoading.value = false
  }
}

async function handleDecision(status) {
  const label = status === 'ACCEPTED' ? '수락' : '거절'
  const extra = status === 'ACCEPTED' ? '\n수락하면 대기 상태의 계약이 자동 생성됩니다.' : ''
  if (!confirm(`이 지원을 ${label}하시겠습니까?${extra}`)) return

  isUpdating.value = true
  try {
    const previousProfile = application.value.portfolioProfile
    const updated = await updateCompanyApplicationStatus(recruitmentId(), applicationId(), status)
    application.value = { ...updated, portfolioProfile: updated.portfolioProfile || previousProfile }
  } catch (error) {
    alert(getCompanyApiError(error, `지원을 ${label}하지 못했습니다. 잠시 후 다시 시도해주세요.`))
  } finally {
    isUpdating.value = false
  }
}

function goToList() {
  router.push({ name: 'CompanyApplicantList', params: { recruitmentId: recruitmentId() } })
}
</script>

<style scoped>
.page { width: 100%; max-width: 900px; margin: 0 auto; padding: 32px; color: #1f2937; }
.top-actions { margin-bottom: 18px; display: flex; justify-content: space-between; gap: 14px; }
.decision-actions { display: flex; gap: 8px; }
.back-button, .decision-actions button, .retry-button { min-height: 38px; padding: 0 14px; border-radius: 6px; background: white; font-size: 13px; font-weight: 600; cursor: pointer; }
.back-button, .retry-button { border: 1px solid #d1d5db; color: #4b5563; }
.reject-button { border: 1px solid #fecaca; color: #dc2626; }
.accept-button { border: 1px solid #1a233d; background: #1a233d !important; color: white; }
.decision-actions button:disabled { opacity: .5; cursor: not-allowed; }
.profile-card { margin-bottom: 14px; border: 1px solid #e5e7eb; border-radius: 12px; background: white; overflow: hidden; }
.profile-heading { padding: 28px; border-bottom: 1px solid #e5e7eb; display: flex; align-items: center; gap: 16px; }
.avatar { width: 54px; height: 54px; border-radius: 50%; background: #e8edf5; color: #1a233d; display: grid; place-items: center; font-size: 19px; font-weight: 700; }
.identity { min-width: 0; }
.name-row { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; }
.name-row h1 { margin: 0; color: #1a233d; font-size: 22px; }
.identity p { margin: 5px 0 0; color: #9ca3af; font-size: 12px; }
.status-badge { min-height: 24px; padding: 0 9px; border-radius: 999px; display: inline-flex; align-items: center; font-size: 10px; font-weight: 700; }
.status-pending { background: #fef9c3; color: #92400e; }
.status-accepted { background: #dcfce7; color: #15803d; }
.status-rejected, .status-cancelled, .status-unknown { background: #fee2e2; color: #991b1b; }
.application-meta { margin: 0; padding: 22px 28px; border-bottom: 1px solid #e5e7eb; background: #fafafa; display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 18px; }
.application-meta dt { margin-bottom: 5px; color: #9ca3af; font-size: 11px; }
.application-meta dd { margin: 0; color: #374151; font-size: 13px; font-weight: 600; overflow-wrap: anywhere; }
.content-section { padding: 26px 28px; }
.content-section h2 { margin: 0 0 14px; color: #1a233d; font-size: 17px; }
.long-text { margin: 0; color: #4b5563; font-size: 14px; line-height: 1.8; white-space: pre-wrap; overflow-wrap: anywhere; }
.section-title-row { margin-bottom: 14px; display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.section-title-row h2 { margin: 0; }
.section-title-row span { color: #6b7280; font-size: 11px; }
.tech-stack-row { margin-top: 17px; display: flex; flex-wrap: wrap; gap: 7px; }
.tech-tag, .portfolio-category { min-height: 24px; padding: 0 9px; border-radius: 999px; background: #f0f4f9; color: #4a6fa5; display: inline-flex; align-items: center; font-size: 10px; font-weight: 600; }
.portfolio-grid { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 12px; }
.portfolio-item { padding: 17px; border: 1px solid #e5e7eb; border-radius: 8px; background: #fafafa; }
.portfolio-item h3 { margin: 12px 0 6px; color: #1a233d; font-size: 14px; }
.portfolio-item p { margin: 0; color: #6b7280; font-size: 12px; line-height: 1.55; }
.empty-note { margin: 0; color: #9ca3af; font-size: 13px; }
.decision-note { margin: 0; padding: 13px 16px; border-radius: 8px; font-size: 12px; text-align: center; }
.decision-note.success { background: #dcfce7; color: #15803d; }
.decision-note.rejected { background: #fee2e2; color: #991b1b; }
.state-card { min-height: 350px; padding: 40px; border: 1px solid #e5e7eb; border-radius: 12px; background: white; color: #6b7280; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
.state-card p { margin: 14px 0 0; }
.error-state { color: #b91c1c; }
.retry-button { margin-top: 18px; }
.spinner { width: 28px; height: 28px; border: 3px solid #dce2eb; border-top-color: #1a233d; border-radius: 50%; animation: spin .8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
@media (max-width: 640px) { .page { padding: 24px 18px; } .top-actions { flex-direction: column; } .decision-actions { justify-content: flex-end; } .application-meta, .portfolio-grid { grid-template-columns: 1fr; } .profile-heading, .content-section { padding: 22px; } }
</style>
