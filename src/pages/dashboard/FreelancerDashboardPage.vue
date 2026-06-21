<template>
  <DashboardOverview :summary-items="summaryItems" :panels="panels" />
</template>

<script setup>
import DashboardOverview from '@/features/dashboard/ui/DashboardOverview.vue'

const summaryItems = [
  { label: '진행 중인 계약', count: 2, icon: 'contract', tone: 'blue', to: '/freelancer/contracts' },
  { label: '받은 제안서', count: 3, icon: 'proposal', tone: 'green', to: '/freelancer/proposals' },
  { label: '지원한 공고', count: 5, icon: 'application', tone: 'purple', to: '/freelancer/applications' },
  { label: '포트폴리오', count: 4, icon: 'portfolio', tone: 'orange', to: '/freelancer/portfolio' },
]

const panels = [
  {
    title: '진행 중인 계약',
    to: '/freelancer/contracts',
    items: [
      {
        title: '모바일 앱 UI/UX 디자인',
        subtitle: '의뢰 기업: 주식회사 랜싯',
        meta: '마감일: 2026-06-30',
        metaIcon: 'calendar',
        badge: '진행중',
        badgeTone: 'green',
        to: '/freelancer/contracts/1',
      },
      {
        title: '브랜드 소개 웹사이트 개발',
        subtitle: '의뢰 기업: 모노랩',
        meta: '마감일: 2026-07-15',
        metaIcon: 'calendar',
        badge: '진행중',
        badgeTone: 'green',
        to: '/freelancer/contracts/2',
      },
    ],
  },
  {
    title: '받은 제안서',
    to: '/freelancer/proposals',
    items: [
      {
        title: '커머스 프론트엔드 고도화',
        subtitle: '오로라커머스',
        meta: '제안일: 2026-06-18',
        badge: '검토중',
        badgeTone: 'blue',
      },
      {
        title: '핀테크 앱 UX 개선',
        subtitle: '파인테크',
        meta: '제안일: 2026-06-16',
        badge: '신규',
        badgeTone: 'purple',
      },
    ],
  },
  {
    title: '지원한 공고',
    to: '/freelancer/applications',
    wide: true,
    items: [
      {
        title: 'B2B SaaS 대시보드 개발',
        subtitle: '넥스트웍스',
        meta: '지원일: 2026-06-15',
        badge: '서류 검토',
        badgeTone: 'blue',
      },
      {
        title: '여행 플랫폼 반응형 웹 디자인',
        subtitle: '트립메이트',
        meta: '지원일: 2026-06-12',
        badge: '면접 예정',
        badgeTone: 'orange',
      },
    ],
  },
  {
    title: '포트폴리오',
    to: '/freelancer/portfolio',
    wide: true,
    items: [
      {
        title: '핀테크 모바일 앱 리디자인',
        subtitle: 'UI/UX · Figma · Prototype',
        meta: '최근 수정: 2026-06-10',
        trailing: '공개',
        to: '/freelancer/portfolio/1',
      },
      {
        title: '커머스 관리자 페이지 구축',
        subtitle: 'Vue.js · TypeScript · Dashboard',
        meta: '최근 수정: 2026-05-28',
        trailing: '공개',
        to: '/freelancer/portfolio/2',
      },
    ],
  },
]
</script>
