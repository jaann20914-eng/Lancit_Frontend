<template>
  <div class="page">
    <div class="top-actions">
      <button type="button" class="back-button" @click="goToRecruitment">← 공고 상세</button>
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
      <article class="application-summary-card">
        <header class="application-heading">
          <div>
            <p class="eyebrow">지원 정보</p>
            <h1>{{ application.recruitmentTitle || '공고명 미등록' }}</h1>
          </div>
          <span :class="['status-badge', application.statusMeta.className]">
            {{ application.statusMeta.label }}
          </span>
        </header>
        <dl class="application-meta">
          <div><dt>지원자</dt><dd>{{ submittedProfile.displayName }}</dd></div>
          <div><dt>지원일</dt><dd>{{ formatDateTime(application.appliedAt) }}</dd></div>
          <div><dt>열람일</dt><dd>{{ formatDateTime(application.viewedAt) }}</dd></div>
          <div><dt>계약</dt><dd>{{ application.contractId ? `계약 #${application.contractId}` : '없음' }}</dd></div>
        </dl>
      </article>

      <section class="content-panel" aria-labelledby="submitted-profile-title">
        <header class="section-heading">
          <div>
            <h2 id="submitted-profile-title">지원 프로필</h2>
            <p>프리랜서가 지원할 때 제출한 프로필입니다.</p>
          </div>
        </header>
        <PortfolioProfileCard
          :profile="submittedProfile"
          :profile-image-url="profileImageUrl"
          :editable="false"
          :show-visibility="false"
        />
      </section>

      <section class="content-panel" aria-labelledby="submitted-projects-title">
        <header class="section-heading">
          <div>
            <h2 id="submitted-projects-title">제출 프로젝트</h2>
            <p>이 공고에 지원하면서 선택한 포트폴리오 프로젝트입니다.</p>
          </div>
          <span class="project-count">{{ application.portfolios.length }}개</span>
        </header>
        <div v-if="application.portfolios.length" class="portfolio-grid">
          <PortfolioCard
            v-for="portfolio in application.portfolios"
            :key="portfolio.portfolioId"
            :portfolio="portfolio"
            :banner-url="portfolioBannerUrls[portfolio.portfolioId]"
            readonly
            :show-visibility="false"
            @view="goToPortfolioDetail"
          />
        </div>
        <p v-else class="empty-note">제출된 프로젝트가 없습니다.</p>
      </section>

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
import {
  getCompanyRecruitment,
  updateCompanyRecruitmentStatus,
} from '@/features/company/recruitments/api/companyRecruitmentApi.js'
import { getCompanyApiError } from '@/features/company/recruitments/api/companyRecruitmentError.js'
import { formatDateTime } from '@/features/company/recruitments/api/companyRecruitmentMapper.js'
import { getPortfolioFileUrl } from '@/features/portfolio/api/portfolioApi.js'
import { getPortfolioProfileImageUrl } from '@/features/portfolio/api/portfolioProfileApi.js'
import PortfolioCard from '@/features/portfolio/ui/PortfolioCard.vue'
import PortfolioProfileCard from '@/features/portfolio/ui/PortfolioProfileCard.vue'

const route = useRoute()
const router = useRouter()

const application = ref(null)
const isLoading = ref(true)
const isUpdating = ref(false)
const errorMessage = ref('')
const profileImageUrl = ref('')
const portfolioBannerUrls = ref({})
const recruitmentId = () => route.params.recruitmentId
const applicationId = () => route.params.applicationId ?? route.params.id
const submittedProfile = computed(() => {
  const profile = application.value?.portfolioProfile ?? {}
  return {
    ...profile,
    displayName: profile.displayName || application.value?.applicantName || '이름 미등록',
    freelancerEmail: profile.freelancerEmail || application.value?.applicantEmail || '',
    jobCategory: profile.jobCategory ?? null,
    isPortfolioPublic: Boolean(profile.isPortfolioPublic),
    intro: profile.intro || '',
    description: profile.description || application.value?.intro || '',
    techStacks: Array.isArray(profile.techStacks) ? profile.techStacks : [],
  }
})

watch([() => recruitmentId(), () => applicationId()], loadApplication, { immediate: true })

async function loadApplication() {
  isLoading.value = true
  errorMessage.value = ''
  profileImageUrl.value = ''
  portfolioBannerUrls.value = {}
  try {
    const data = await getCompanyApplication(recruitmentId(), applicationId())
    if (!data) throw new Error('Invalid application response')
    application.value = data
    if (data.status === 'ACCEPTED') await ensureRecruitmentClosed().catch(() => null)
    await loadSubmittedAssetUrls(data)
  } catch (error) {
    application.value = null
    errorMessage.value = getCompanyApiError(error, '지원 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.')
  } finally {
    isLoading.value = false
  }
}

async function loadSubmittedAssetUrls(data) {
  const profileFileId = data.portfolioProfile?.profileFileId
  const profileImagePromise =
    profileFileId === null || profileFileId === undefined
      ? Promise.resolve('')
      : getPortfolioProfileImageUrl(profileFileId).catch(() => '')

  const bannerEntriesPromise = Promise.all(
    data.portfolios.map(async (portfolio) => {
      if (portfolio.bannerFileId === null || portfolio.bannerFileId === undefined) return null
      const bannerUrl = await getPortfolioFileUrl(portfolio.bannerFileId).catch(() => '')
      return bannerUrl ? [portfolio.portfolioId, bannerUrl] : null
    }),
  )

  const [resolvedProfileImageUrl, bannerEntries] = await Promise.all([
    profileImagePromise,
    bannerEntriesPromise,
  ])
  profileImageUrl.value = resolvedProfileImageUrl
  portfolioBannerUrls.value = Object.fromEntries(bannerEntries.filter(Boolean))
}

async function handleDecision(status) {
  const label = status === 'ACCEPTED' ? '수락' : '거절'
  const extra =
    status === 'ACCEPTED'
      ? '\n수락하면 대기 상태의 계약이 자동 생성되고 공고가 마감됩니다.'
      : ''
  if (!confirm(`이 지원을 ${label}하시겠습니까?${extra}`)) return

  isUpdating.value = true
  try {
    const previousApplication = application.value
    const updated = await updateCompanyApplicationStatus(recruitmentId(), applicationId(), status)
    application.value = {
      ...previousApplication,
      ...updated,
      portfolioProfile: updated.portfolioProfile || previousApplication.portfolioProfile,
      portfolios: updated.portfolios.length ? updated.portfolios : previousApplication.portfolios,
    }

    if (status === 'ACCEPTED') {
      try {
        await ensureRecruitmentClosed()
      } catch (error) {
        alert(
          getCompanyApiError(
            error,
            '지원 수락은 완료되었지만 공고를 마감하지 못했습니다. 공고 상세에서 상태를 확인해주세요.',
          ),
        )
      }
    }
  } catch (error) {
    alert(getCompanyApiError(error, `지원을 ${label}하지 못했습니다. 잠시 후 다시 시도해주세요.`))
  } finally {
    isUpdating.value = false
  }
}

async function ensureRecruitmentClosed() {
  const relatedRecruitment = await getCompanyRecruitment(recruitmentId())
  if (!relatedRecruitment || relatedRecruitment.status === 'CLOSED') return
  if (relatedRecruitment.status === 'CANCELLED') return
  await updateCompanyRecruitmentStatus(recruitmentId(), 'CLOSED')
}

function goToRecruitment() {
  router.push({ name: 'CompanyRecruitmentDetail', params: { recruitmentId: recruitmentId() } })
}

function goToPortfolioDetail(portfolio) {
  if (portfolio?.portfolioId === null || portfolio?.portfolioId === undefined) return
  router.push({
    name: 'TalentPortfolioDetail',
    params: { id: portfolio.portfolioId },
    query: {
      from: 'applicant',
      recruitmentId: recruitmentId(),
      applicationId: applicationId(),
    },
  })
}
</script>

<style scoped>
.page { width: 100%; max-width: 1000px; margin: 0 auto; padding: 32px; color: #1f2937; }
.top-actions { margin-bottom: 18px; display: flex; justify-content: space-between; gap: 14px; }
.decision-actions { display: flex; gap: 8px; }
.back-button, .decision-actions button, .retry-button { min-height: 38px; padding: 0 14px; border-radius: 6px; background: white; font-size: 13px; font-weight: 600; cursor: pointer; }
.back-button, .retry-button { border: 1px solid #d1d5db; color: #4b5563; }
.reject-button { border: 1px solid #fecaca; color: #dc2626; }
.accept-button { border: 1px solid #1a233d; background: #1a233d !important; color: white; }
.decision-actions button:disabled { opacity: .5; cursor: not-allowed; }
.application-summary-card, .content-panel { margin-bottom: 16px; border: 1px solid #e5e7eb; border-radius: 12px; background: white; overflow: hidden; }
.application-heading { padding: 26px 28px; display: flex; align-items: center; justify-content: space-between; gap: 18px; }
.eyebrow { margin: 0 0 6px; color: #9ca3af; font-size: 11px; font-weight: 600; }
.application-heading h1 { margin: 0; color: #1a233d; font-size: 21px; line-height: 1.4; }
.status-badge { min-height: 24px; padding: 0 9px; border-radius: 999px; display: inline-flex; align-items: center; font-size: 10px; font-weight: 700; }
.status-pending { background: #fef9c3; color: #92400e; }
.status-accepted { background: #dcfce7; color: #15803d; }
.status-rejected, .status-cancelled, .status-unknown { background: #fee2e2; color: #991b1b; }
.application-meta { margin: 0; padding: 20px 28px; border-top: 1px solid #e5e7eb; background: #fafafa; display: grid; grid-template-columns: repeat(4, minmax(0,1fr)); gap: 18px; }
.application-meta dt { margin-bottom: 5px; color: #9ca3af; font-size: 11px; }
.application-meta dd { margin: 0; color: #374151; font-size: 13px; font-weight: 600; overflow-wrap: anywhere; }
.content-panel { padding: 26px 28px 28px; }
.section-heading { margin-bottom: 18px; display: flex; align-items: flex-start; justify-content: space-between; gap: 18px; }
.section-heading h2 { margin: 0 0 5px; color: #1a233d; font-size: 19px; }
.section-heading p { margin: 0; color: #6b7280; font-size: 12px; }
.project-count { min-width: 42px; min-height: 28px; padding: 0 9px; border-radius: 999px; background: #e8edf5; color: #1a233d; display: inline-flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; }
.portfolio-grid { display: grid; grid-template-columns: repeat(4, minmax(0,1fr)); gap: 16px; }
.empty-note { margin: 0; padding: 34px; border: 1px dashed #d1d5db; border-radius: 10px; color: #9ca3af; font-size: 13px; text-align: center; }
.decision-note { margin: 0; padding: 13px 16px; border-radius: 8px; font-size: 12px; text-align: center; }
.decision-note.success { background: #dcfce7; color: #15803d; }
.decision-note.rejected { background: #fee2e2; color: #991b1b; }
.state-card { min-height: 350px; padding: 40px; border: 1px solid #e5e7eb; border-radius: 12px; background: white; color: #6b7280; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
.state-card p { margin: 14px 0 0; }
.error-state { color: #b91c1c; }
.retry-button { margin-top: 18px; }
.spinner { width: 28px; height: 28px; border: 3px solid #dce2eb; border-top-color: #1a233d; border-radius: 50%; animation: spin .8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
@media (max-width: 1100px) { .portfolio-grid { grid-template-columns: repeat(2, minmax(0,1fr)); } }
@media (max-width: 760px) { .application-meta { grid-template-columns: repeat(2, minmax(0,1fr)); } }
@media (max-width: 640px) { .page { padding: 24px 18px; } .top-actions { flex-direction: column; } .decision-actions { justify-content: flex-end; } .application-heading, .section-heading { align-items: flex-start; } .portfolio-grid { grid-template-columns: 1fr; } .content-panel { padding: 22px; } }
@media (max-width: 440px) { .application-meta { grid-template-columns: 1fr; } }
</style>
