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

function buildPath(path, id) {
  return id === null || id === undefined ? null : `${path}/${id}`
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
    to: buildPath('/freelancer/contracts', item.contractId),
  }
}

function mapFreelancerProposal(item) {
  const status = getStatusMeta(item.status, CONTRACT_STATUS_META)
  return {
    key: `proposal-${item.contractId}`,
    title: item.title || '제목 없는 제안',
    subtitle: getDisplayName(item.companyName, item.companyEmail, '기업 정보 없음'),
    meta: `제안일: ${formatDate(item.proposedAt)}`,
    badge: status.label,
    badgeTone: status.tone,
    to: buildPath('/freelancer/contracts', item.contractId),
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
    to: buildPath('/freelancer/applications', item.recruitmentId),
  }
}

function mapFreelancerPortfolio(item) {
  const subtitle = [getPortfolioCategoryLabel(item.category), item.summary]
    .filter(Boolean)
    .join(' · ')

  return {
    key: `portfolio-${item.portfolioId}`,
    title: item.title || '제목 없는 포트폴리오',
    subtitle: subtitle || '등록된 소개가 없습니다.',
    meta: `최근 수정: ${formatDate(item.updatedAt)}`,
    trailing: item.isPublic ? '공개' : '비공개',
    to: buildPath('/freelancer/portfolio', item.portfolioId),
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
    to: buildPath('/company/contracts', item.contractId),
  }
}

function mapCompanyApplication(item) {
  const status = getStatusMeta(item.status, APPLICATION_STATUS_META)
  const subtitle = [jobCategoryLabel(item.jobCategory), item.recruitmentTitle]
    .filter(Boolean)
    .join(' · ')

  const to =
    item.recruitmentId === null ||
    item.recruitmentId === undefined ||
    item.applicationId === null ||
    item.applicationId === undefined
      ? null
      : `/company/recruitments/${item.recruitmentId}/applicants/${item.applicationId}`

  return {
    key: `application-${item.applicationId}`,
    title: getDisplayName(item.applicantName, item.applicantEmail, '지원자 정보 없음'),
    subtitle: subtitle || '지원 정보 없음',
    meta: `지원일: ${formatDate(item.appliedAt)}`,
    badge: status.label,
    badgeTone: status.tone,
    to,
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
    to: buildPath('/company/recruitments', item.recruitmentId),
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
        to: '/freelancer/contracts',
      },
      {
        label: '받은 제안서',
        count: asCount(summary.receivedProposalCount),
        icon: 'proposal',
        tone: 'green',
        to: '/freelancer/proposals',
      },
      {
        label: '지원한 공고',
        count: asCount(summary.appliedRecruitmentCount),
        icon: 'application',
        tone: 'purple',
        to: '/freelancer/applications',
      },
      {
        label: '포트폴리오',
        count: asCount(summary.portfolioCount),
        icon: 'portfolio',
        tone: 'orange',
        to: '/freelancer/portfolio',
      },
    ],
    panels: [
      {
        title: '진행 중인 계약',
        to: '/freelancer/contracts',
        items: asList(data.recentContracts).map(mapFreelancerContract),
        emptyMessage: '진행 중인 계약이 없습니다.',
      },
      {
        title: '받은 제안서',
        to: '/freelancer/proposals',
        items: asList(data.recentProposals).map(mapFreelancerProposal),
        emptyMessage: '받은 제안서가 없습니다.',
      },
      {
        title: '지원한 공고',
        to: '/freelancer/applications',
        wide: true,
        items: asList(data.recentApplications).map(mapFreelancerApplication),
        emptyMessage: '지원한 공고가 없습니다.',
      },
      {
        title: '포트폴리오',
        to: '/freelancer/portfolio',
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
        to: '/company/contracts',
      },
      {
        label: '받은 지원서',
        count: asCount(summary.receivedApplicationCount),
        icon: 'people',
        tone: 'green',
        to: '/company/recruitments',
      },
      {
        label: '공고문',
        count: asCount(summary.recruitmentCount),
        icon: 'briefcase',
        tone: 'purple',
        to: '/company/recruitments',
      },
      {
        label: '제안한 인재',
        count: asCount(summary.proposedTalentCount),
        icon: 'trend',
        tone: 'orange',
        to: '/company/talents',
      },
    ],
    panels: [
      {
        title: '진행 중인 계약',
        to: '/company/contracts',
        items: asList(data.recentContracts).map(mapCompanyContract),
        emptyMessage: '진행 중인 계약이 없습니다.',
      },
      {
        title: '최근 받은 지원서',
        to: '/company/recruitments',
        items: asList(data.recentApplications).map(mapCompanyApplication),
        emptyMessage: '최근 받은 지원서가 없습니다.',
      },
      {
        title: '활성 공고문',
        to: '/company/recruitments',
        wide: true,
        items: asList(data.recentRecruitments).map(mapCompanyRecruitment),
        emptyMessage: '활성 공고문이 없습니다.',
      },
    ],
  }
}
