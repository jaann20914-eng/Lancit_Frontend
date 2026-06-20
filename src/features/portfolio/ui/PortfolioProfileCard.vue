<template>
  <article class="profile-card">
    <div class="profile-main">
      <div class="avatar" aria-hidden="true">
        <img v-if="profileImageUrl" :src="profileImageUrl" alt="" />
        <span v-else>{{ initial }}</span>
      </div>

      <div class="profile-content">
        <div class="profile-heading">
          <div>
            <div class="identity-row">
              <h3>{{ profile.displayName || '이름 미등록' }}</h3>
              <span
                v-if="showVisibility"
                :class="['visibility', profile.isPortfolioPublic ? 'public' : 'private']"
              >
                {{ profile.isPortfolioPublic ? '전체 공개' : '비공개' }}
              </span>
            </div>
            <p class="meta">{{ jobCategoryLabel }} · {{ profile.freelancerEmail }}</p>
          </div>

          <button v-if="editable" type="button" class="edit-button" @click="$emit('edit')">
            프로필 수정
          </button>
        </div>

        <p :class="['intro', { empty: !profile.intro }]">
          {{ profile.intro || '나를 소개하는 한 줄을 작성해보세요.' }}
        </p>

        <p v-if="profile.description" class="description">{{ profile.description }}</p>

        <div v-if="profile.techStacks.length" class="tech-stack-list" aria-label="기술 스택">
          <span v-for="techStack in profile.techStacks" :key="techStack" class="tech-stack">
            {{ techStack }}
          </span>
        </div>
        <p v-else class="empty-tech-stacks">등록된 기술 스택이 없습니다.</p>
      </div>
    </div>
  </article>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  profile: {
    type: Object,
    required: true,
  },
  profileImageUrl: {
    type: String,
    default: '',
  },
  editable: {
    type: Boolean,
    default: true,
  },
  showVisibility: {
    type: Boolean,
    default: true,
  },
})

defineEmits(['edit'])

const JOB_CATEGORY_LABELS = {
  DESIGN: '디자인',
  IT: 'IT',
  MUSIC: '음악',
  EDUCATION: '교육',
  VIDEO: '영상',
  MARKETING: '마케팅',
  WRITING: '글쓰기',
  ETC: '기타',
}

const initial = computed(() => props.profile.displayName?.trim().charAt(0) || '?')
const jobCategoryLabel = computed(() => {
  const category = props.profile.jobCategory
  return JOB_CATEGORY_LABELS[category] || category || '직종 미등록'
})
</script>

<style scoped>
.profile-card {
  padding: 24px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #ffffff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.profile-main {
  display: flex;
  align-items: flex-start;
  gap: 20px;
}

.avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: #e8edf5;
  color: #1a233d;
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  font-size: 23px;
  font-weight: 700;
}

.avatar img {
  width: 100%;
  height: 100%;
  border-radius: inherit;
  object-fit: cover;
}

.profile-content {
  min-width: 0;
  flex: 1;
}

.profile-heading,
.identity-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.profile-heading {
  justify-content: space-between;
  align-items: flex-start;
}

h3 {
  margin: 0;
  color: #1a233d;
  font-size: 18px;
  font-weight: 700;
}

.visibility {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  padding: 0 9px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
}

.visibility.public {
  background: #dcfce7;
  color: #15803d;
}

.visibility.private {
  background: #f3f4f6;
  color: #6b7280;
}

.meta {
  margin: 6px 0 0;
  overflow-wrap: anywhere;
  color: #9ca3af;
  font-size: 12px;
}

.edit-button {
  min-height: 36px;
  padding: 0 13px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: #ffffff;
  color: #374151;
  flex: 0 0 auto;
  font-size: 13px;
  cursor: pointer;
}

.edit-button:hover {
  border-color: #1a233d;
  color: #1a233d;
}

.intro {
  margin: 18px 0 14px;
  color: #374151;
  font-size: 15px;
  line-height: 1.6;
}

.description {
  margin: -4px 0 14px;
  color: #64748b;
  font-size: 13px;
  line-height: 1.7;
  white-space: pre-wrap;
}

.intro.empty,
.empty-tech-stacks {
  color: #9ca3af;
}

.tech-stack-list {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
}

.tech-stack {
  padding: 5px 10px;
  border-radius: 999px;
  background: #eef2f7;
  color: #334155;
  font-size: 12px;
  font-weight: 500;
}

.empty-tech-stacks {
  margin: 0;
  font-size: 12px;
}

@media (max-width: 600px) {
  .profile-main {
    gap: 14px;
  }

  .avatar {
    width: 48px;
    height: 48px;
    font-size: 18px;
  }

  .profile-heading {
    flex-direction: column;
  }
}
</style>
