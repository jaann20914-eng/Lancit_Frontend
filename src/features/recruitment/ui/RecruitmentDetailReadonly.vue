<template>
  <div class="readonly-wrap">
    <!-- 배너 이미지: 있을 때만 -->
    <img v-if="imageUrl" :src="imageUrl" alt="공고 배너" class="cover-image" />

    <div v-if="!recruitment" class="empty-state">공고 정보를 불러오는 중...</div>

    <template v-else>
      <!-- 헤더 -->
      <div class="detail-heading">
        <div class="badge-row">
          <span class="category-badge">{{
            recruitment.jobCategoryLabel || recruitment.jobCategory
          }}</span>
          <span class="category-badge light">{{
            recruitment.recruitmentCategoryLabel || recruitment.recruitmentCategory
          }}</span>
        </div>
        <p class="company-name">{{ recruitment.companyName || '기업 정보 없음' }}</p>
        <h2 class="title">{{ recruitment.title || '제목 없는 공고' }}</h2>
        <p class="summary">{{ recruitment.summary || '등록된 요약이 없습니다.' }}</p>
      </div>

      <!-- 정보 그리드 -->
      <dl class="information-grid">
        <div>
          <dt>예산</dt>
          <dd>{{ formatBudget(recruitment.budget) }}</dd>
        </div>
        <div>
          <dt>근무 위치</dt>
          <dd>{{ recruitment.workLocation || '협의' }}</dd>
        </div>
        <div>
          <dt>모집 기간</dt>
          <dd>
            {{ formatPeriod(recruitment.recruitmentStartAt, recruitment.recruitmentEndAt) }}
          </dd>
        </div>
        <div>
          <dt>예상 계약 기간</dt>
          <dd>{{ formatPeriod(recruitment.contractStartAt, recruitment.contractEndAt) }}</dd>
        </div>
        <div>
          <dt>지원자 수</dt>
          <dd>{{ (recruitment.applicantCount ?? 0).toLocaleString('ko-KR') }}명</dd>
        </div>
        <div>
          <dt>등록일</dt>
          <dd>{{ formatDate(recruitment.createdAt) }}</dd>
        </div>
      </dl>

      <!-- 기술 스택 -->
      <div v-if="recruitment.techStacks?.length" class="detail-section">
        <h3>기술 스택</h3>
        <div class="tech-stack-row">
          <span v-for="tech in recruitment.techStacks" :key="tech" class="tech-tag">{{
            tech
          }}</span>
        </div>
      </div>

      <!-- 공고 내용 -->
      <div class="detail-section">
        <h3>공고 내용</h3>
        <p class="content">{{ recruitment.content || '등록된 상세 내용이 없습니다.' }}</p>
      </div>

      <!-- 요구사항 -->
      <div v-if="recruitment.requirements" class="detail-section">
        <h3>요구사항</h3>
        <p class="content">{{ recruitment.requirements }}</p>
      </div>
    </template>
  </div>
</template>

<script setup>
import {
  formatBudget,
  formatDate,
} from '@/features/company/recruitments/api/companyRecruitmentMapper.js'

defineProps({
  recruitment: { type: Object, default: null },
  imageUrl: { type: String, default: '' }, // 추가
})

function formatPeriod(start, end) {
  if (!start && !end) return '미정'
  return `${start ? formatDate(start) : '미정'} ~ ${end ? formatDate(end) : '미정'}`
}
</script>

<style scoped>
.readonly-wrap {
  padding-bottom: 16px;
  color: #1f2937;
}

.empty-state {
  padding: 40px;
  text-align: center;
  color: #9ca3af;
  font-size: 13px;
}

/* 헤더 */
.detail-heading {
  padding: 20px 20px 16px;
  border-bottom: 1px solid #e5e7eb;
}

.badge-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 10px;
}

.category-badge {
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  background: #e8edf5;
  color: #1a233d;
}

.category-badge.light {
  background: #f3f4f6;
  color: #6b7280;
}

.company-name {
  margin: 0 0 4px;
  color: #6b7280;
  font-size: 12px;
  font-weight: 600;
}

.title {
  margin: 0 0 6px;
  font-size: 18px;
  font-weight: 700;
  color: #1a233d;
  line-height: 1.35;
}

.summary {
  margin: 0;
  color: #4b5563;
  font-size: 13px;
  line-height: 1.6;
}

/* 정보 그리드 */
.information-grid {
  margin: 0;
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
  background: #fafafa;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.information-grid dt {
  margin-bottom: 3px;
  color: #9ca3af;
  font-size: 11px;
}

.information-grid dd {
  margin: 0;
  color: #374151;
  font-size: 13px;
  font-weight: 600;
  overflow-wrap: anywhere;
}

/* 섹션 */
.detail-section {
  padding: 16px 20px;
  border-bottom: 1px solid #f3f4f6;
}

.detail-section h3 {
  margin: 0 0 10px;
  font-size: 14px;
  font-weight: 700;
  color: #1a233d;
}

.content {
  margin: 0;
  color: #4b5563;
  font-size: 13px;
  line-height: 1.85;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

/* 기술 스택 */
.tech-stack-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tech-tag {
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 500;
  background: #f0f4f9;
  color: #4a6fa5;
}

.cover-image {
  width: 100%;
  max-height: 200px;
  object-fit: cover;
  display: block;
}
</style>
