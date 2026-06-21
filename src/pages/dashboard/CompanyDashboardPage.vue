<template>
  <DashboardOverview :summary-items="summaryItems" :panels="panels" />
</template>

<script setup>
import DashboardOverview from '@/features/dashboard/ui/DashboardOverview.vue'

const summaryItems = [
  { label: '진행 중인 계약', count: 2, icon: 'contract', tone: 'blue', to: '/company/contracts' },
  { label: '받은 지원서', count: 6, icon: 'people', tone: 'green', to: '/company/recruitments' },
  { label: '공고문', count: 3, icon: 'briefcase', tone: 'purple', to: '/company/recruitments' },
  { label: '제안한 인재', count: 4, icon: 'trend', tone: 'orange', to: '/company/talents' },
]

const panels = [
  {
    title: '진행 중인 계약',
    to: '/company/contracts',
    items: [
      {
        title: '모바일 앱 UI/UX 디자인',
        subtitle: '프리랜서: 박지원',
        meta: '마감일: 2026-06-30',
        metaIcon: 'calendar',
        badge: '진행중',
        badgeTone: 'green',
        to: '/company/contracts/1',
      },
      {
        title: '웹사이트 리디자인',
        subtitle: '프리랜서: 김수현',
        meta: '마감일: 2026-07-15',
        metaIcon: 'calendar',
        badge: '진행중',
        badgeTone: 'green',
        to: '/company/contracts/2',
      },
    ],
  },
  {
    title: '최근 받은 지원서',
    to: '/company/recruitments',
    items: [
      {
        title: '이민준',
        subtitle: '프론트엔드 개발자',
        meta: '지원일: 2026-05-22',
        badge: '개발',
        badgeTone: 'blue',
      },
      {
        title: '정서윤',
        subtitle: 'UI/UX 디자이너',
        meta: '지원일: 2026-05-21',
        badge: '디자인',
        badgeTone: 'blue',
      },
    ],
  },
  {
    title: '활성 공고문',
    to: '/company/recruitments',
    wide: true,
    items: [
      {
        title: '모바일 앱 UI/UX 디자인',
        meta: '게시일: 2026-05-10',
        trailing: '지원자 8명',
      },
      {
        title: '웹사이트 개발 프로젝트',
        meta: '게시일: 2026-05-12',
        trailing: '지원자 5명',
      },
    ],
  },
]
</script>
