<template>
  <article
    :class="['portfolio-card', { selected, readonly }]"
    tabindex="0"
    :role="selectable ? 'checkbox' : undefined"
    :aria-checked="selectable ? selected : undefined"
    :aria-disabled="selectable ? disabled : undefined"
    @click="handleCardClick"
    @keydown.enter.self.prevent="handleCardClick"
  >
    <div class="card-banner">
      <img v-if="resolvedBannerUrl" :src="resolvedBannerUrl" :alt="`${title} 배너`" />
      <label v-if="selectable" class="selection-control" @click.stop>
        <input
          type="checkbox"
          :checked="selected"
          :disabled="disabled"
          @change="$emit('select', portfolio, $event.target.checked)"
        />
        <span>{{ selected ? '선택됨' : '선택' }}</span>
      </label>
      <div v-else-if="!readonly" class="card-actions">
        <button type="button" class="edit-button" @click.stop="$emit('edit', portfolio)">
          수정
        </button>
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

    <div class="card-body">
      <span class="category body-category">{{ categoryLabel }}</span>
      <h2>{{ title }}</h2>
      <p class="summary">{{ summary }}</p>

      <div class="card-footer">
        <span class="period">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <path d="M16 2v4M8 2v4M3 10h18" />
          </svg>
          {{ period }}
        </span>
        <span v-if="showVisibility" :class="['visibility', visibility.className]">
          {{ visibility.label }}
        </span>
      </div>
    </div>
  </article>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  portfolio: {
    type: Object,
    required: true,
  },
  isDeleting: {
    type: Boolean,
    default: false,
  },
  bannerUrl: {
    type: String,
    default: '',
  },
  selectable: {
    type: Boolean,
    default: false,
  },
  selected: {
    type: Boolean,
    default: false,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  readonly: {
    type: Boolean,
    default: false,
  },
  showVisibility: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits(['view', 'edit', 'delete', 'select'])

const CATEGORY_LABELS = {
  WEB_APP: '웹/앱',
  DESIGN: '디자인',
  VIDEO: '영상',
  BRANDING: '브랜딩',
  MARKETING: '마케팅',
  PLANNING: '기획',
}

const title = computed(() => props.portfolio.title || props.portfolio.projectTitle || '제목 없음')
const summary = computed(
  () => props.portfolio.summary || props.portfolio.description || '설명이 없습니다.',
)
const resolvedBannerUrl = computed(
  () =>
    props.bannerUrl ||
    props.portfolio.bannerImageUrl ||
    props.portfolio.bannerUrl ||
    props.portfolio.imageUrl ||
    '',
)
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
  const startDate = props.portfolio.workStartAt || props.portfolio.startDate
  const endDate = props.portfolio.workEndAt || props.portfolio.endDate
  if (!startDate && !endDate) return '기간 미정'
  return `${formatDate(startDate) || '시작일 미정'} - ${formatDate(endDate) || '진행 중'}`
})

function formatDate(value) {
  if (!value) return ''
  return String(value).slice(0, 10).replaceAll('-', '.')
}

function handleCardClick() {
  if (props.selectable) {
    if (props.disabled) return
    emit('select', props.portfolio, !props.selected)
    return
  }
  emit('view', props.portfolio)
}
</script>

<style scoped>
.portfolio-card {
  min-width: 0;
  overflow: hidden;
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: 10px;
  background: var(--color-bg-surface, #ffffff);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  cursor: pointer;
  transition:
    border-color 0.15s,
    box-shadow 0.15s,
    transform 0.15s;
}

.portfolio-card:hover,
.portfolio-card:focus-visible {
  border-color: #7f89a1;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  transform: translateY(-1px);
  outline: none;
}

.portfolio-card.selected {
  border-color: var(--color-primary, #1a233d);
  box-shadow: 0 0 0 2px rgba(26, 35, 61, 0.12);
}

.portfolio-card[aria-disabled='true'] {
  opacity: 0.65;
  cursor: not-allowed;
  transform: none;
}

.card-banner {
  position: relative;
  width: 100%;
  height: 110px;
  background: linear-gradient(
    135deg,
    var(--color-primary, #1a233d),
    var(--color-secondary-hover, #3a5a8a)
  );
}

.card-banner img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.card-body {
  padding: 12px 14px 14px;
}

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
  min-height: 22px;
  padding: 0 8px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 600;
}

.category {
  background: var(--color-primary-light, #e8edf5);
  color: var(--color-primary, #1a233d);
}

.body-category {
  margin-bottom: 6px;
}

.visibility-public {
  background: var(--color-success-bg, #dcfce7);
  color: var(--color-success-text, #15803d);
}

.visibility-private {
  background: var(--color-neutral-bg, #f3f4f6);
  color: var(--color-neutral, #6b7280);
}

h2 {
  margin: 0 0 4px;
  overflow: hidden;
  color: var(--color-primary, #1a233d);
  font-size: 13px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.summary {
  min-height: 30px;
  margin: 0;
  overflow: hidden;
  color: var(--color-text-muted, #9ca3af);
  font-size: 11px;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.card-footer {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid var(--color-gray-100, #f3f4f6);
}

.period {
  min-width: 0;
  color: var(--color-text-secondary, #4b5563);
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 10px;
}

.period svg {
  width: 12px;
  height: 12px;
  flex-shrink: 0;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
}

.card-actions {
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  gap: 6px;
}

.selection-control {
  position: absolute;
  top: 8px;
  right: 8px;
  min-height: 28px;
  padding: 0 9px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  color: #374151;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 10px;
  font-weight: 600;
  cursor: pointer;
}

.selection-control input {
  width: 14px;
  height: 14px;
  margin: 0;
  accent-color: var(--color-primary, #1a233d);
}

.selection-control:has(input:disabled) {
  cursor: not-allowed;
}

.card-actions button {
  height: 24px;
  padding: 0 8px;
  border-radius: 5px;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  font-size: 10px;
  font-weight: 600;
  cursor: pointer;
}

.edit-button {
  border: 1px solid var(--color-gray-300, #d1d5db);
  color: var(--color-gray-700, #374151);
}

.delete-button {
  border: 1px solid var(--color-danger-bg, #fee2e2);
  color: var(--color-danger-hover, #dc2626);
}

.card-actions button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

@media (max-width: 420px) {
  .card-footer {
    align-items: flex-start;
    flex-direction: column;
  }

  .visibility {
    align-self: flex-end;
  }
}
</style>
