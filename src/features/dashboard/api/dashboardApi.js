import { getCompanyApplications } from '@/features/company/applicants/api/companyApplicationApi.js'
import { getMyRecruitments } from '@/features/company/recruitments/api/companyRecruitmentApi.js'
import { getMyPortfolios, getPortfolioFileUrl } from '@/features/portfolio/api/portfolioApi.js'
import { getRecruitments } from '@/features/recruitments/api/recruitmentApi.js'
import httpClient from '@/shared/api/httpClient.js'
import { ENV } from '@/shared/config/env.js'

function unwrapResponse(response) {
  return response.data?.data ?? response.data
}

function normalizePage(data) {
  const content = Array.isArray(data?.content) ? data.content : []
  return {
    content,
    totalElements: Number(data?.totalElements ?? content.length),
  }
}

function valueOf(source, ...keys) {
  const key = keys.find((candidate) => source?.[candidate] !== undefined)
  return key ? source[key] : null
}

function mapContract(contract) {
  return {
    contractId: valueOf(contract, 'contractId', 'contract_id'),
    recruitmentTitle: valueOf(contract, 'recruitmentTitle', 'recruitment_title') || '공고명 미등록',
    companyEmail: valueOf(contract, 'companyEmail', 'company_email') || '기업 정보 없음',
    freelancerEmail: valueOf(contract, 'freelancerEmail', 'freelancer_email') || '프리랜서 정보 없음',
  }
}

async function getContractPage(params) {
  const baseUrl = ENV.API_BASE_URL.replace(/\/$/, '')
  const response = await httpClient.get(`${baseUrl}/contracts`, { params })
  return normalizePage(unwrapResponse(response))
}

function formatDate(value) {
  return value ? String(value).slice(0, 10).replaceAll('-', '.') : '미정'
}

function contractItems(page, role) {
  return page.content.map(mapContract).map((contract) => ({
    title: contract.recruitmentTitle,
    subtitle: role === 'COMPANY'
      ? `프리랜서: ${contract.freelancerEmail}`
      : `의뢰 기업: ${contract.companyEmail}`,
    badge: '진행중',
    badgeTone: 'green',
    to: `/${role === 'COMPANY' ? 'company' : 'freelancer'}/contracts/${contract.contractId}`,
  }))
}

export async function getFreelancerDashboard() {
  const [contracts, proposals, applications, portfolios] = await Promise.all([
    getContractPage({ status: 'IN_PROGRESS', page: 1, size: 2 }),
    getContractPage({ status: 'WAITING', page: 1, size: 2 }),
    getRecruitments({ tab: 'APPLIED', page: 1, size: 2, sort: 'LATEST' }),
    getMyPortfolios({ page: 1, size: 4, sort: 'latest' }),
  ])

  const proposalItems = proposals.content.map(mapContract).map((contract) => ({
    title: contract.recruitmentTitle,
    subtitle: contract.companyEmail,
    badge: '검토중',
    badgeTone: 'blue',
    to: `/freelancer/contracts/${contract.contractId}`,
  }))
  const applicationItems = applications.content.map((recruitment) => ({
    title: recruitment.title || '제목 없는 공고',
    subtitle: recruitment.companyName || '기업 정보 없음',
    meta: `지원 마감: ${formatDate(recruitment.recruitmentEndAt)}`,
    badge: '지원 완료',
    badgeTone: 'blue',
    to: `/freelancer/recruitments/${recruitment.recruitmentId}`,
  }))
  const portfolioItems = await Promise.all(portfolios.content.map(async (portfolio) => {
    let bannerUrl = ''

    if (portfolio.bannerFileId !== null && portfolio.bannerFileId !== undefined) {
      try {
        bannerUrl = await getPortfolioFileUrl(portfolio.bannerFileId)
      } catch {
        // 배너 조회 실패 시 PortfolioCard의 기본 배경을 사용합니다.
      }
    }

    return { portfolio, bannerUrl }
  }))

  return {
    summaryItems: [
      { label: '진행 중인 계약', count: contracts.totalElements, icon: 'contract', tone: 'blue', to: '/freelancer/contracts' },
      { label: '받은 제안서', count: proposals.totalElements, icon: 'proposal', tone: 'green', to: '/freelancer/proposals' },
      { label: '지원한 공고', count: applications.totalElements, icon: 'application', tone: 'purple', to: '/freelancer/recruitments?tab=APPLIED' },
      { label: '포트폴리오', count: portfolios.totalElements, icon: 'portfolio', tone: 'orange', to: '/freelancer/portfolio' },
    ],
    panels: [
      { title: '진행 중인 계약', to: '/freelancer/contracts', items: contractItems(contracts, 'USER') },
      { title: '받은 제안서', to: '/freelancer/proposals', items: proposalItems },
      { title: '지원한 공고', to: '/freelancer/recruitments?tab=APPLIED', wide: true, items: applicationItems },
      { title: '포트폴리오', to: '/freelancer/portfolio', type: 'portfolio', wide: true, items: portfolioItems },
    ],
  }
}

export async function getCompanyDashboard() {
  const [contracts, proposals, recruitments] = await Promise.all([
    getContractPage({ status: 'IN_PROGRESS', page: 1, size: 2 }),
    getContractPage({ status: 'WAITING', page: 1, size: 2 }),
    getMyRecruitments({ page: 1, size: 100, sort: 'LATEST' }),
  ])

  const recruitmentsWithApplicants = recruitments.content.filter(
    (recruitment) => recruitment.applicantCount > 0,
  )
  const applicationResults = await Promise.allSettled(
    recruitmentsWithApplicants.map(async (recruitment) => {
      const page = await getCompanyApplications(recruitment.recruitmentId, { page: 1, size: 2 })
      return page.content.map((application) => ({ ...application, recruitmentTitle: recruitment.title }))
    }),
  )
  const applications = applicationResults
    .flatMap((result) => result.status === 'fulfilled' ? result.value : [])
    .sort((first, second) => new Date(second.appliedAt || 0) - new Date(first.appliedAt || 0))
    .slice(0, 2)

  const applicationItems = applications.map((application) => ({
    title: application.applicantName || application.applicantEmail || '지원자 정보 없음',
    subtitle: application.recruitmentTitle || '공고명 미등록',
    meta: `지원일: ${formatDate(application.appliedAt)}`,
    badge: application.statusMeta?.label || '검토중',
    badgeTone: application.status === 'ACCEPTED' ? 'green' : 'blue',
    to: `/company/recruitments/${application.recruitmentId}/applicants/${application.applicationId}`,
  }))
  const activeRecruitmentItems = recruitments.content
    .filter((recruitment) => recruitment.status === 'OPEN')
    .slice(0, 2)
    .map((recruitment) => ({
      title: recruitment.title || '제목 없는 공고',
      meta: `게시일: ${formatDate(recruitment.createdAt)}`,
      trailing: `지원자 ${recruitment.applicantCount}명`,
      to: `/company/recruitments/${recruitment.recruitmentId}`,
    }))
  const totalApplications = recruitments.content.reduce(
    (total, recruitment) => total + recruitment.applicantCount,
    0,
  )

  return {
    summaryItems: [
      { label: '진행 중인 계약', count: contracts.totalElements, icon: 'contract', tone: 'blue', to: '/company/contracts' },
      { label: '받은 지원서', count: totalApplications, icon: 'people', tone: 'green', to: '/company/recruitments' },
      { label: '공고문', count: recruitments.totalElements, icon: 'briefcase', tone: 'purple', to: '/company/recruitments' },
      { label: '제안한 인재', count: proposals.totalElements, icon: 'trend', tone: 'orange', to: '/company/contracts' },
    ],
    panels: [
      { title: '진행 중인 계약', to: '/company/contracts', items: contractItems(contracts, 'COMPANY') },
      { title: '최근 받은 지원서', to: '/company/recruitments', items: applicationItems },
      { title: '활성 공고문', to: '/company/recruitments', wide: true, items: activeRecruitmentItems },
    ],
  }
}
