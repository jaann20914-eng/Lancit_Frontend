import { describe, expect, it } from 'vitest'
import { mapCompanyDashboardToView, mapFreelancerDashboardToView } from './dashboardMapper.js'

describe('dashboardMapper', () => {
  it('maps freelancer counts, labels, and detail paths', () => {
    const result = mapFreelancerDashboardToView({
      summary: {
        inProgressContractCount: 2,
        receivedProposalCount: 3,
        appliedRecruitmentCount: 4,
        portfolioCount: 5,
      },
      recentContracts: [
        {
          contractId: 11,
          title: '계약 프로젝트',
          companyName: '랜싯',
          deadline: '2026-07-15T00:00:00',
          status: 'IN_PROGRESS',
        },
      ],
      recentProposals: [
        {
          contractId: 12,
          title: '신규 제안',
          companyName: '제안 기업',
          proposedAt: '2026-06-18T10:00:00',
          status: 'WAITING',
        },
      ],
      recentApplications: [
        {
          applicationId: 31,
          recruitmentId: 21,
          title: '지원 공고',
          companyName: '채용 기업',
          appliedAt: '2026-06-15T10:00:00',
          status: 'PENDING',
        },
      ],
      recentPortfolios: [
        {
          portfolioId: 41,
          title: '프로젝트 포트폴리오',
          summary: '프로젝트 소개',
          category: 'WEB_APP',
          updatedAt: '2026-06-10T10:00:00',
          isPublic: true,
        },
      ],
    })

    expect(result.summaryItems.map((item) => item.count)).toEqual([2, 3, 4, 5])
    expect(result.panels[0].items[0]).toMatchObject({
      badge: '진행중',
      meta: '마감일: 2026-07-15',
      to: '/freelancer/contracts/11',
    })
    expect(result.panels[1].items[0].to).toBe('/freelancer/contracts/12')
    expect(result.panels[2].items[0].to).toBe('/freelancer/applications/21')
    expect(result.panels[3].items[0]).toMatchObject({
      subtitle: '웹/앱 · 프로젝트 소개',
      trailing: '공개',
      to: '/freelancer/portfolio/41',
    })
  })

  it('maps company applications and recruitments to their actual detail paths', () => {
    const result = mapCompanyDashboardToView({
      summary: {
        inProgressContractCount: 1,
        receivedApplicationCount: 2,
        recruitmentCount: 3,
        proposedTalentCount: 4,
      },
      recentContracts: [
        {
          contractId: 51,
          title: '진행 계약',
          freelancerName: '김프리',
          deadline: '2026-08-01',
          status: 'IN_PROGRESS',
        },
      ],
      recentApplications: [
        {
          applicationId: 61,
          recruitmentId: 62,
          recruitmentTitle: '개발자 모집',
          applicantName: '이지원',
          jobCategory: 'IT',
          appliedAt: '2026-06-20',
          status: 'ACCEPTED',
        },
      ],
      recentRecruitments: [
        {
          recruitmentId: 71,
          title: '활성 공고',
          createdAt: '2026-06-01',
          applicantCount: 8,
          status: 'OPEN',
        },
      ],
    })

    expect(result.summaryItems.map((item) => item.count)).toEqual([1, 2, 3, 4])
    expect(result.panels[0].items[0].to).toBe('/company/contracts/51')
    expect(result.panels[1].items[0]).toMatchObject({
      subtitle: 'IT · 개발자 모집',
      badge: '수락',
      to: '/company/recruitments/62/applicants/61',
    })
    expect(result.panels[2].items[0]).toMatchObject({
      badge: '모집중',
      trailing: '지원자 8명',
      to: '/company/recruitments/71',
    })
  })

  it('provides zero counts and explicit empty panel messages for an empty response', () => {
    const freelancer = mapFreelancerDashboardToView()
    const company = mapCompanyDashboardToView()

    expect(freelancer.summaryItems.every((item) => item.count === 0)).toBe(true)
    expect(company.summaryItems.every((item) => item.count === 0)).toBe(true)
    expect(freelancer.panels.every((panel) => panel.items.length === 0)).toBe(true)
    expect(company.panels.every((panel) => panel.emptyMessage)).toBe(true)
  })
})
