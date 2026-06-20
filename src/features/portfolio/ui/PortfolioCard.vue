<template>
  <article class="portfolio-card" tabindex="0" @click="emitView" @keydown.enter.self="emitView">
    <div class="card-header">
      <span class="category">{{ categoryLabel }}</span>
      <span :class="['visibility', visibility.className]">{{ visibility.label }}</span>
    </div>

    <h2>{{ title }}</h2>
    <p class="summary">{{ summary }}</p>

    <div class="card-footer">
      <span class="period">{{ period }}</span>
      <div class="card-actions">
        <button type="button" class="edit-button" @click.stop="$emit('edit', portfolio)">수정</button>
        <button
          type="button"
          class="delete-button"
          :disabled="isDeleting"
          @click.stop="$emit('delete', portfolio)"
        >
          {{ isDeleting ? '삭제 중...' : '삭제' }}
        </button>
      </div>
    </div>
  </article>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  portfolio: {
    type: Object,
    required: true
  },
  isDeleting: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['view', 'edit', 'delete'])

const CATEGORY_LABELS = {
  WEB_APP: '웹/앱',
  DESIGN: '디자인',
  BRANDING: '브랜딩',
  MARKETING: '마케팅',
  PLANNING: '기획'
}

const title = computed(() => props.portfolio.title || '제목 없는 프로젝트')
const summary = computed(() => props.portfolio.summary || '프로젝트 소개가 없습니다.')
const categoryLabel = computed(() => {
  const category = props.portfolio.category
  return CATEGORY_LABELS[category] || category || '미분류'
})

const visibility = computed(() => {
  const value = props.portfolio.isPublic
  return value
    ? { label: '공개', className: 'visibility-public' }
    : { label: '비공개', className: 'visibility-private' }
})

const period = computed(() => {
  const startDate = props.portfolio.workStartAt
  const endDate = props.portfolio.workEndAt
  if (!startDate && !endDate) return '기간 미정'
  return `${formatDate(startDate) || '시작일 미정'} - ${formatDate(endDate) || '진행 중'}`
})

function formatDate(value) {
  if (!value) return ''
  return String(value).slice(0, 10).replaceAll('-', '.')
}

function emitView() {
  emit('view', props.portfolio)
}
</script>

<style scoped>
.portfolio-card {
  min-width: 0;
  padding: 22px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #ffffff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  cursor: pointer;
  transition: border-color 0.15s, box-shadow 0.15s, transform 0.15s;
}

.portfolio-card:hover,
.portfolio-card:focus-visible {
  border-color: #b8c2d3;
  box-shadow: 0 6px 16px rgba(26, 35, 61, 0.08);
  transform: translateY(-2px);
  outline: none;
}

.card-header,
.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.category,
.visibility {
  display: inline-flex;
  align-items: center;
  min-height: 26px;
  padding: 0 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 500;
}

.category {
  background: #e8edf5;
  color: #1a233d;
}

.visibility-public {
  background: #dcfce7;
  color: #15803d;
}

.visibility-private {
  background: #f3f4f6;
  color: #6b7280;
}

h2 {
  margin: 18px 0 8px;
  overflow: hidden;
  color: #1a233d;
  font-size: 18px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.summary {
  min-height: 42px;
  margin: 0;
  overflow: hidden;
  color: #6b7280;
  font-size: 14px;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.card-footer {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #f0f1f3;
}

.period {
  color: #9ca3af;
  font-size: 12px;
}

.card-actions {
  display: flex;
  gap: 6px;
}

.card-actions button {
  height: 32px;
  padding: 0 11px;
  border-radius: 6px;
  background: #ffffff;
  font-size: 12px;
  cursor: pointer;
}

.edit-button {
  border: 1px solid #d1d5db;
  color: #374151;
}

.delete-button {
  border: 1px solid #fecaca;
  color: #dc2626;
}

.card-actions button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

@media (max-width: 560px) {
  .card-footer {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
