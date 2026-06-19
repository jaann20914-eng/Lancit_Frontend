<template>
  <div class="empty-state">
    <div class="empty-icon" aria-hidden="true">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
        <path d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z" />
        <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
      </svg>
    </div>
    <h2>{{ title }}</h2>
    <p v-if="description">{{ description }}</p>
    <button v-if="buttonText" type="button" class="action-button" @click="$emit('action')">
      {{ buttonText }}
    </button>
  </div>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    default: '등록된 프로젝트가 없습니다.'
  },
  description: {
    type: String,
    default: ''
  },
  buttonText: {
    type: String,
    default: ''
  }
})

defineEmits(['action'])
</script>

<style scoped>
.empty-state {
  min-height: 320px;
  padding: 56px 24px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.empty-icon {
  width: 64px;
  height: 64px;
  margin-bottom: 18px;
  border-radius: 50%;
  background: #e8edf5;
  color: #1a233d;
  display: flex;
  align-items: center;
  justify-content: center;
}

h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1a233d;
}

p {
  margin: 8px 0 0;
  font-size: 14px;
  line-height: 1.6;
  color: #6b7280;
}

.action-button {
  margin-top: 22px;
  height: 40px;
  padding: 0 18px;
  border: none;
  border-radius: 6px;
  background: #1a233d;
  color: #ffffff;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}

.action-button:hover {
  background: #253a63;
}
</style>
