import { jobCategoryLabel } from '@/shared/constants/jobCategory.js'

const CONTRACT_STATUS_META = {
  WAITING: { label: '제안중', tone: 'purple' },
  NEGOTIATING_A: { label: '협의중', tone: 'blue' },
  NEGOTIATING_B: { label: '협의중', tone: 'blue' },
  NEGOTIATING_C: { label: '협의중', tone: 'blue' },
  IN_PROGRESS: { label: '진행중', tone: 'green' },
  COMPLETED_PENDING: { label: '완료 대기', tone: 'orange' },
  COMPLETED: { label: '완료', tone: 'gray' },
  CANCELLED: { label: '파기', tone: 'gray' },
}

const APPLICATION_STATUS_META = {
  PENDING: { label: '검토중', tone: 'blue' },
  ACCEPTED: { label: '수락', tone: 'green' },
  REJECTED: { label: '미채택', tone: 'orange' },
  CANCELLED: { label: '지원 취소', tone: 'gray' },
}

const RECRUITMENT_STATUS_META = {
  OPEN: { label: '모집중', tone: 'green' },
  CLOSED: { label: '마감', tone: 'gray' },
  EXPIRED: { label: '기간 만료', tone: 'orange' },
  CANCELLED: { label: '취소', tone: 'gray' },
}

const PORTFOLIO_CATEGORY_LABELS = {
  WEB_APP: '웹/앱',
  DESIGN: '디자인',
  BRANDING: '브랜딩',
  MARKETING: '마케팅',
  PLANNING: '기획',
}

function asList(value) {
  return Array.isArray(value) ? value : []
}

function asCount(value) {
  const count = Number(value)
  return Number.isFinite(count) && count >= 0 ? count : 0
}

function formatDate(value) {
  return value ? String(value).slice(0, 10) : '미정'
}

function getStatusMeta(status, metadata) {
  return metadata[status] || { label: status || '상태 미정', tone: 'gray' }
}

function getDisplayName(name, email, fallback) {
  return name || email || fallback
}

function getPortfolioCategoryLabel(category) {
  return PORTFOLIO_CATEGORY_LABELS[category] || category || ''
}

function hasRouteValue(value) {
  return value !== null && value !== undefined && value !== ''
}

function buildRoute(name, params = {}, query = undefined) {
  const entries = Object.entries(params)
  if (entries.some(([, value]) => !hasRouteValue(value))) return null

  const route = { name }
  if (entries.length) route.params = Object.fromEntries(entries)
  if (query) route.query = query
  return route
}

function mapFreelancerContract(item) {
  const status = getStatusMeta(item.status, CONTRACT_STATUS_META)
  return {
    key: `contract-${item.contractId}`,
    title: item.title || '제목 없는 계약',
    subtitle: `의뢰 기업: ${getDisplayName(item.companyName, item.companyEmail, '기업 정보 없음')}`,
    meta: `마감일: ${formatDate(item.deadline)}`,
    metaIcon: 'calendar',
    badge: status.label,
    badgeTone: status.tone,
    to: buildRoute('ContractDetail', { id: item.contractId }),
  }
}

function mapFreelancerProposal(item) {
  const status = getStatusMeta(item.status, CONTRACT_STATUS_META)
  return {
    key: `proposal-${item.contractId}`,
    title: item.recruitmentTitle || item.title || '제목 없는 제안',
    subtitle: getDisplayName(item.companyName, item.companyEmail, '기업 정보 없음'),
    meta: `제안일: ${formatDate(item.proposedAt || item.createdAt)}`,
    badge: status.label,
    badgeTone: status.tone,
    to:
      buildRoute('RecruitmentDetail', { id: item.recruitmentId }, { from: 'proposal' }) ||
      buildRoute('ContractDetail', { id: item.contractId }),
  }
}

function mapFreelancerApplication(item) {
  const status = getStatusMeta(item.status, APPLICATION_STATUS_META)
  return {
    key: `application-${item.applicationId ?? item.recruitmentId}`,
    title: item.title || '제목 없는 공고',
    subtitle: getDisplayName(item.companyName, item.companyEmail, '기업 정보 없음'),
    meta: `지원일: ${formatDate(item.appliedAt)}`,
    badge: status.label,
    badgeTone: status.tone,
    to: buildRoute('ApplicationDetail', { id: item.recruitmentId }),
  }
}

function mapFreelancerPortfolio(item) {
  const subtitle = [getPortfolioCategoryLabel(item.category), item.summary]
    .filter(Boolean)
    .join(' · ')

  return {
    key: `portfolio-${item.portfolioId}`,
    portfolio: item,
    bannerUrl: item.bannerImageUrl || item.bannerUrl || '',
    title: item.title || '제목 없는 포트폴리오',
    subtitle: subtitle || '등록된 소개가 없습니다.',
    meta: `최근 수정: ${formatDate(item.updatedAt)}`,
    trailing: item.isPublic ? '공개' : '비공개',
    to: buildRoute('PortfolioDetail', { id: item.portfolioId }),
  }
}

function mapCompanyContract(item) {
  const status = getStatusMeta(item.status, CONTRACT_STATUS_META)
  return {
    key: `contract-${item.contractId}`,
    title: item.title || '제목 없는 계약',
    subtitle: `프리랜서: ${getDisplayName(item.freelancerName, item.freelancerEmail, '프리랜서 정보 없음')}`,
    meta: `마감일: ${formatDate(item.deadline)}`,
    metaIcon: 'calendar',
    badge: status.label,
    badgeTone: status.tone,
    to: buildRoute('CompanyContractDetail', { id: item.contractId }),
  }
}

function mapCompanyApplication(item) {
  const status = getStatusMeta(item.status, APPLICATION_STATUS_META)
  const subtitle = [jobCategoryLabel(item.jobCategory), item.recruitmentTitle]
    .filter(Boolean)
    .join(' · ')

  return {
    key: `application-${item.applicationId}`,
    title: getDisplayName(item.applicantName, item.applicantEmail, '지원자 정보 없음'),
    subtitle: subtitle || '지원 정보 없음',
    meta: `지원일: ${formatDate(item.appliedAt)}`,
    badge: status.label,
    badgeTone: status.tone,
    to: buildRoute('CompanyApplicantDetail', {
      recruitmentId: item.recruitmentId,
      applicationId: item.applicationId,
    }),
  }
}

function mapCompanyRecruitment(item) {
  const status = getStatusMeta(item.status, RECRUITMENT_STATUS_META)
  return {
    key: `recruitment-${item.recruitmentId}`,
    title: item.title || '제목 없는 공고',
    meta: `게시일: ${formatDate(item.createdAt)}`,
    badge: status.label,
    badgeTone: status.tone,
    trailing: `지원자 ${asCount(item.applicantCount).toLocaleString('ko-KR')}명`,
    to: buildRoute('CompanyRecruitmentDetail', { recruitmentId: item.recruitmentId }),
  }
}

export function mapFreelancerDashboardToView(data = {}) {
  const summary = data.summary || {}
  return {
    summaryItems: [
      {
        label: '진행 중인 계약',
        count: asCount(summary.inProgressContractCount),
        icon: 'contract',
        tone: 'blue',
        to: buildRoute('ContractList'),
      },
      {
        label: '받은 제안서',
        count: asCount(summary.receivedProposalCount),
        icon: 'proposal',
        tone: 'green',
        to: buildRoute('ProposalList'),
      },
      {
        label: '지원한 공고',
        count: asCount(summary.appliedRecruitmentCount),
        icon: 'application',
        tone: 'purple',
        to: buildRoute('RecruitmentList', {}, { tab: 'APPLIED' }),
      },
      {
        label: '포트폴리오',
        count: asCount(summary.portfolioCount),
        icon: 'portfolio',
        tone: 'orange',
        to: buildRoute('PortfolioList'),
      },
    ],
    panels: [
      {
        title: '진행 중인 계약',
        to: buildRoute('ContractList'),
        items: asList(data.recentContracts).map(mapFreelancerContract),
        emptyMessage: '진행 중인 계약이 없습니다.',
      },
      {
        title: '받은 제안서',
        to: buildRoute('ProposalList'),
        items: asList(data.recentProposals).map(mapFreelancerProposal),
        emptyMessage: '받은 제안서가 없습니다.',
      },
      {
        title: '지원한 공고',
        to: buildRoute('RecruitmentList', {}, { tab: 'APPLIED' }),
        wide: true,
        items: asList(data.recentApplications).map(mapFreelancerApplication),
        emptyMessage: '지원한 공고가 없습니다.',
      },
      {
        title: '포트폴리오',
        to: buildRoute('PortfolioList'),
        type: 'portfolio',
        wide: true,
        items: asList(data.recentPortfolios).map(mapFreelancerPortfolio),
        emptyMessage: '등록한 포트폴리오가 없습니다.',
      },
    ],
  }
}

export function mapCompanyDashboardToView(data = {}) {
  const summary = data.summary || {}
  return {
    summaryItems: [
      {
        label: '진행 중인 계약',
        count: asCount(summary.inProgressContractCount),
        icon: 'contract',
        tone: 'blue',
        to: buildRoute('CompanyContractList'),
      },
      {
        label: '받은 지원서',
        count: asCount(summary.receivedApplicationCount),
        icon: 'people',
        tone: 'green',
        to: buildRoute('CompanyRecruitmentList'),
      },
      {
        label: '공고문',
        count: asCount(summary.recruitmentCount),
        icon: 'briefcase',
        tone: 'purple',
        to: buildRoute('CompanyRecruitmentList'),
      },
      {
        label: '제안한 인재',
        count: asCount(summary.proposedTalentCount),
        icon: 'trend',
        tone: 'orange',
        to: buildRoute('TalentSearch'),
      },
    ],
    panels: [
      {
        title: '진행 중인 계약',
        to: buildRoute('CompanyContractList'),
        items: asList(data.recentContracts).map(mapCompanyContract),
        emptyMessage: '진행 중인 계약이 없습니다.',
      },
      {
        title: '최근 받은 지원서',
        to: buildRoute('CompanyRecruitmentList'),
        items: asList(data.recentApplications).map(mapCompanyApplication),
        emptyMessage: '최근 받은 지원서가 없습니다.',
      },
      {
        title: '활성 공고문',
        to: buildRoute('CompanyRecruitmentList'),
        wide: true,
        items: asList(data.recentRecruitments).map(mapCompanyRecruitment),
        emptyMessage: '활성 공고문이 없습니다.',
      },
    ],
  }
}
