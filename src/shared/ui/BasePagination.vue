<template>
  <nav class="base-pagination" aria-label="페이지">
    <span v-if="totalItemCount !== null" class="base-pagination__sr-only">
      총 {{ formattedTotalItemCount }}개, 페이지 크기 {{ normalizedPageSize }}
    </span>
    <button
      type="button"
      class="base-pagination__button"
      :disabled="isDisabled || normalizedCurrentPage === 1"
      aria-label="첫 페이지"
      @click="moveTo(1)"
    >
      «
    </button>
    <button
      type="button"
      class="base-pagination__button"
      :disabled="isDisabled || normalizedCurrentPage === 1"
      aria-label="이전 페이지"
      @click="moveTo(normalizedCurrentPage - 1)"
    >
      ‹
    </button>
    <button
      v-for="page in visiblePages"
      :key="page"
      type="button"
      :class="['base-pagination__button', { active: page === normalizedCurrentPage }]"
      :aria-current="page === normalizedCurrentPage ? 'page' : undefined"
      :disabled="isDisabled"
      @click="moveTo(page)"
    >
      {{ page }}
    </button>
    <button
      type="button"
      class="base-pagination__button"
      :disabled="isDisabled || normalizedCurrentPage === normalizedTotalPages"
      aria-label="다음 페이지"
      @click="moveTo(normalizedCurrentPage + 1)"
    >
      ›
    </button>
    <button
      type="button"
      class="base-pagination__button"
      :disabled="isDisabled || normalizedCurrentPage === normalizedTotalPages"
      aria-label="마지막 페이지"
      @click="moveTo(normalizedTotalPages)"
    >
      »
    </button>
  </nav>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  currentPage: {
    type: Number,
    default: 1,
  },
  totalPages: {
    type: Number,
    default: 1,
  },
  totalElements: {
    type: Number,
    default: null,
  },
  totalCount: {
    type: Number,
    default: null,
  },
  pageSize: {
    type: Number,
    default: null,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  maxVisiblePages: {
    type: Number,
    default: 5,
  },
})

const emit = defineEmits(['update:page', 'change'])

const normalizedTotalPages = computed(() => Math.max(1, Number(props.totalPages) || 1))
const normalizedCurrentPage = computed(() => {
  const current = Number(props.currentPage) || 1
  return Math.min(Math.max(current, 1), normalizedTotalPages.value)
})
const normalizedPageSize = computed(() => Number(props.pageSize) || 0)
const totalItemCount = computed(() => props.totalElements ?? props.totalCount ?? null)
const formattedTotalItemCount = computed(() => Number(totalItemCount.value).toLocaleString('ko-KR'))
const isDisabled = computed(() => props.disabled)

const visiblePages = computed(() => {
  const total = normalizedTotalPages.value

  const maxVisible = Math.max(1, Number(props.maxVisiblePages) || 5)
  if (total <= maxVisible) return Array.from({ length: total }, (_, index) => index + 1)

  const half = Math.floor(maxVisible / 2)
  let start = Math.max(1, normalizedCurrentPage.value - half)
  let end = start + maxVisible - 1

  if (end > total) {
    end = total
    start = Math.max(1, end - maxVisible + 1)
  }

  return Array.from({ length: end - start + 1 }, (_, index) => start + index)
})

function moveTo(page) {
  if (isDisabled.value) return

  const nextPage = Math.min(Math.max(Number(page) || 1, 1), normalizedTotalPages.value)
  if (nextPage === normalizedCurrentPage.value) return

  emit('update:page', nextPage)
  emit('change', nextPage)
}
</script>

<style scoped>
.base-pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  margin-top: 24px;
  padding-top: 16px;
  flex-wrap: wrap;
}

.base-pagination__button {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 6px;
  background: none;
  color: #6c757d;
  font-size: 13px;
  line-height: 1;
  cursor: pointer;
  transition:
    background-color 0.15s,
    color 0.15s,
    opacity 0.15s;
}

.base-pagination__button:hover:not(:disabled) {
  background: #f3f4f6;
}

.base-pagination__button.active {
  background: #1a233d;
  color: #ffffff;
  font-weight: 600;
}

.base-pagination__button:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.base-pagination__sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

@media (max-width: 420px) {
  .base-pagination {
    gap: 2px;
  }

  .base-pagination__button {
    width: 30px;
    height: 30px;
  }
}
</style>
