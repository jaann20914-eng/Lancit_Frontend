<template>
  <article class="recruitment-card">
    <div class="card-main">
      <div class="card-heading">
        <div class="title-area">
          <button type="button" class="title-button" @click="emitViewDetail">
            {{ job.title || '제목 없는 공고' }}
          </button>
          <div class="meta-row">
            <span class="meta-item">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M4 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16M16 9h2a2 2 0 0 1 2 2v10M8 7h4M8 11h4M8 15h4M3 21h18"
                />
              </svg>
              {{ displayText(job.companyName, '기관 정보 없음') }}
            </span>
            <span class="meta-separator" aria-hidden="true">·</span>
            <span class="meta-item">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
                <circle cx="12" cy="10" r="2.5" />
              </svg>
              {{ displayText(job.location, '-') }}
            </span>
          </div>
        </div>

        <div class="badge-row">
          <span v-if="showAiRecommendedTag" class="ai-recommendation-badge">
            AI가 추천하는 공고입니다.
          </span>
          <span
            v-if="job.recommendationLabel"
            :class="['recommendation-badge', job.recommendationClassName]"
          >
            {{ job.recommendationLabel }}
          </span>
          <span v-if="job.freelanceTypeLabel" class="freelance-badge">
            {{ job.freelanceTypeLabel }}
          </span>
        </div>
      </div>

      <dl class="information-panel">
        <div class="information-item">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <rect x="3" y="4" width="18" height="16" rx="2" />
            <path d="M7 8h10M7 12h10M7 16h6" />
          </svg>
          <div>
            <dt>업종 카테고리</dt>
            <dd>{{ displayText(job.jobCategoryRaw, '-') }}</dd>
          </div>
        </div>
        <div class="information-item">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <ellipse cx="12" cy="5" rx="7" ry="3" />
            <path
              d="M5 5v5c0 1.7 3.1 3 7 3s7-1.3 7-3V5M5 10v5c0 1.7 3.1 3 7 3s7-1.3 7-3v-5M5 15v4c0 1.7 3.1 3 7 3s7-1.3 7-3v-4"
            />
          </svg>
          <div>
            <dt>급여/보수</dt>
            <dd>{{ displayText(job.salaryText, '-') }}</dd>
          </div>
        </div>
        <div class="information-item">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" />
          </svg>
          <div>
            <dt>마감일</dt>
            <dd>{{ formatExternalDate(job.deadlineAt) }}</dd>
          </div>
        </div>
        <div class="information-item">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M4 19V5a2 2 0 0 1 2-2h11l3 3v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z"
            />
            <path d="M14 3v5h5M8 13h8M8 17h5" />
          </svg>
          <div>
            <dt>출처</dt>
            <dd>{{ displayText(job.sourceLabel, '-') }}</dd>
          </div>
        </div>
      </dl>

      <div class="card-footer">
        <div class="action-buttons">
          <BaseButton
            class="detail-button"
            type="button"
            variant="outline"
            size="sm"
            @click="emitViewDetail"
          >
            {{ job.detailButtonLabel || '상세 보기' }}
          </BaseButton>
          <a
            v-if="job.sourceUrl"
            class="source-link"
            :href="job.sourceUrl"
            target="_blank"
            rel="noopener noreferrer"
          >
            {{ job.sourceButtonLabel || '사이트에서 확인' }}
          </a>
          <button v-else type="button" class="source-link disabled-link" disabled>
            원문 없음
          </button>
        </div>
      </div>
    </div>
  </article>
</template>

<script setup>
import BaseButton from '@/shared/ui/BaseButton.vue'

const props = defineProps({
  job: {
    type: Object,
    required: true,
  },
  showAiRecommendedTag: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['view-detail'])

function emitViewDetail() {
  emit('view-detail', props.job.externalJobId)
}

function displayText(value, fallback = '-') {
  return typeof value === 'string' && value.trim() ? value : fallback
}

function formatExternalDate(value) {
  if (!value) return '-'
  return String(value).slice(0, 10).replaceAll('-', '.')
}
</script>

<style scoped>
.recruitment-card {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: white;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.05);
  transition:
    border-color 0.15s,
    box-shadow 0.15s;
}
.recruitment-card:hover {
  border-color: #d1d5db;
  box-shadow: 0 6px 18px rgba(15, 23, 42, 0.08);
}
.card-main {
  padding: 22px 24px 16px;
}
.card-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}
.title-area {
  min-width: 0;
}
.title-button {
  padding: 0;
  border: 0;
  background: none;
  color: #1a233d;
  font-size: 19px;
  font-weight: 700;
  line-height: 1.4;
  text-align: left;
  overflow-wrap: anywhere;
  cursor: pointer;
}
.title-button:hover {
  text-decoration: underline;
}
.badge-row {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 8px;
  flex: 0 0 auto;
}
.recommendation-badge,
.ai-recommendation-badge,
.freelance-badge {
  min-height: 25px;
  padding: 0 9px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  font-size: 11px;
  font-weight: 600;
}
.ai-recommendation-badge {
  background: #1a233d;
  color: #ffffff;
}
.recommendation-high {
  background: #fef3c7;
  color: #92400e;
}
.recommendation-recommended {
  background: #dcfce7;
  color: #15803d;
}
.recommendation-possible,
.recommendation-unknown {
  background: #e0f2fe;
  color: #0369a1;
}
.freelance-badge {
  background: #ede9fe;
  color: #6d28d9;
}
.meta-row {
  margin-top: 8px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  color: #7c8799;
  font-size: 12px;
}
.meta-item {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}
.meta-item svg {
  width: 15px;
  height: 15px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.7;
}
.meta-separator {
  color: #cbd5e1;
}
.information-panel {
  margin: 16px 0 0;
  padding: 13px 14px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fcfcfd;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
}
.information-item {
  min-width: 0;
  padding: 0 14px;
  border-right: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  gap: 11px;
}
.information-item:first-child {
  padding-left: 0;
}
.information-item:last-child {
  padding-right: 0;
  border-right: 0;
}
.information-item > svg {
  width: 22px;
  height: 22px;
  fill: none;
  stroke: #64748b;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.6;
  flex: 0 0 auto;
}
.information-item div {
  min-width: 0;
}
.information-item dt {
  margin-bottom: 3px;
  color: #9ca3af;
  font-size: 10px;
}
.information-item dd {
  margin: 0;
  color: #374151;
  font-size: 12px;
  font-weight: 600;
  overflow-wrap: anywhere;
}
.card-footer {
  min-height: 48px;
  padding-top: 12px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 16px;
}
.action-buttons {
  display: flex;
  gap: 8px;
  flex: 0 0 auto;
}
.detail-button {
  min-height: 36px;
  padding: 0 14px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
}
.source-link {
  min-height: 36px;
  padding: 0 14px;
  border: 1px solid #1a233d;
  border-radius: 6px;
  background: #1a233d;
  color: white;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
}
.disabled-link {
  border-color: #d1d5db;
  background: #e5e7eb;
  color: #9ca3af;
  cursor: not-allowed;
}

@media (max-width: 800px) {
  .information-panel {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .information-item {
    padding: 12px;
    border-right: 0;
    border-bottom: 1px solid #e5e7eb;
  }
  .information-item:nth-child(odd) {
    padding-left: 0;
    border-right: 1px solid #e5e7eb;
  }
  .information-item:nth-child(even) {
    padding-right: 0;
  }
  .information-item:nth-last-child(-n + 2) {
    border-bottom: 0;
  }
}
@media (max-width: 560px) {
  .card-heading {
    flex-direction: column;
  }
  .badge-row {
    width: 100%;
    justify-content: flex-start;
  }
  .information-panel {
    grid-template-columns: 1fr;
  }
  .information-item,
  .information-item:nth-child(odd),
  .information-item:nth-child(even) {
    padding: 12px 0;
    border-right: 0;
    border-bottom: 1px solid #e5e7eb;
  }
  .information-item:first-child {
    padding-top: 0;
  }
  .information-item:last-child {
    padding-bottom: 0;
    border-bottom: 0;
  }
  .card-footer {
    align-items: stretch;
    flex-direction: column;
  }
  .action-buttons {
    display: grid;
    grid-template-columns: 1fr;
  }
}
</style>
