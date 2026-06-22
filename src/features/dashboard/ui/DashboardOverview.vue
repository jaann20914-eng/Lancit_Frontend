<template>
  <div class="dashboard-page">
    <header class="dashboard-header">
      <div>
        <h1>대시보드</h1>
        <p>프로젝트 현황을 한눈에 확인하세요</p>
      </div>
    </header>

    <div v-if="isLoading" class="dashboard-state" role="status">
      <span class="loading-spinner" aria-hidden="true"></span>
      <p>대시보드를 불러오고 있습니다.</p>
    </div>

    <div v-else-if="errorMessage" class="dashboard-state dashboard-error" role="alert">
      <p>{{ errorMessage }}</p>
      <button type="button" @click="$emit('retry')">다시 시도</button>
    </div>

    <template v-else>
      <section class="summary-grid" aria-label="주요 현황">
        <RouterLink
          v-for="item in summaryItems"
          :key="item.label"
          :to="item.to"
          class="summary-card"
        >
          <div class="summary-copy">
            <span class="summary-label">{{ item.label }}</span>
            <strong class="summary-count">{{ item.count }}</strong>
          </div>
          <span :class="['summary-icon', `summary-icon--${item.tone}`]" aria-hidden="true">
            <svg v-if="item.icon === 'contract'" viewBox="0 0 24 24">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
              <path d="M14 2v6h6M8 13h8M8 17h6" />
            </svg>
            <svg v-else-if="item.icon === 'people'" viewBox="0 0 24 24">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <svg v-else-if="item.icon === 'briefcase'" viewBox="0 0 24 24">
              <rect x="3" y="7" width="18" height="14" rx="2" />
              <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M12 12v4M3 12h18" />
            </svg>
            <svg v-else-if="item.icon === 'trend'" viewBox="0 0 24 24">
              <path d="m3 17 6-6 4 4 8-9" />
              <path d="M15 6h6v6" />
            </svg>
            <svg v-else-if="item.icon === 'proposal'" viewBox="0 0 24 24">
              <path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z" />
              <path d="M8 8h8M8 12h5" />
            </svg>
            <svg v-else-if="item.icon === 'application'" viewBox="0 0 24 24">
              <rect x="3" y="4" width="18" height="16" rx="2" />
              <path d="M8 2v4M16 2v4M3 9h18M8 14l2 2 5-5" />
            </svg>
            <svg v-else viewBox="0 0 24 24">
              <rect x="3" y="4" width="18" height="16" rx="2" />
              <path d="M8 4V2M16 4V2M7 9h10M7 13h4M7 17h7" />
            </svg>
          </span>
        </RouterLink>
      </section>

      <div class="dashboard-grid">
        <DashboardPanel
          v-for="panel in panels"
          :key="panel.title"
          :panel="panel"
          :class="{ 'dashboard-panel--wide': panel.wide }"
        />
      </div>
    </template>
  </div>
</template>

<script setup>
import DashboardPanel from './DashboardPanel.vue'

defineEmits(['retry'])

defineProps({
  summaryItems: {
    type: Array,
    required: true,
  },
  panels: {
    type: Array,
    required: true,
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
  errorMessage: {
    type: String,
    default: '',
  },
})

</script>

<style scoped>
.dashboard-page {
  width: 100%;
  max-width: 100%;
  margin: 0 auto;
  padding: 32px 32px 48px;
  color: #1a233d;
}

.dashboard-header {
  margin-bottom: 28px;
}

.dashboard-header h1 {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  line-height: 1.3;
  letter-spacing: -0.04em;
}

.dashboard-header p {
  margin: 8px 0 0;
  color: #7b8494;
  font-size: 14px;
}

.dashboard-state {
  min-height: 360px;
  padding: 40px;
  border: 1px solid #e1e4e9;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 2px 4px rgba(26, 35, 61, 0.08);
  color: #6f7888;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.dashboard-state p {
  margin: 14px 0 0;
  font-size: 14px;
}

.dashboard-error {
  color: #b91c1c;
}

.dashboard-error button {
  min-height: 38px;
  margin-top: 18px;
  padding: 0 15px;
  border: 1px solid #1a233d;
  border-radius: 6px;
  background: #fff;
  color: #1a233d;
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.loading-spinner {
  width: 30px;
  height: 30px;
  border: 3px solid #dce2eb;
  border-top-color: #1a233d;
  border-radius: 50%;
  animation: dashboard-spin 0.8s linear infinite;
}

@keyframes dashboard-spin {
  to {
    transform: rotate(360deg);
  }
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 22px;
  margin-bottom: 30px;
}

.summary-card {
  min-width: 0;
  min-height: 112px;
  padding: 22px 24px;
  border: 1px solid #e1e4e9;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 2px 4px rgba(26, 35, 61, 0.11);
  color: inherit;
  text-decoration: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  transition:
    transform 0.16s ease,
    box-shadow 0.16s ease,
    border-color 0.16s ease;
}

.summary-card:hover {
  transform: translateY(-2px);
  border-color: #cfd5df;
  box-shadow: 0 7px 18px rgba(26, 35, 61, 0.12);
}

.summary-card:focus-visible {
  outline: 3px solid rgba(59, 130, 246, 0.24);
  outline-offset: 2px;
}

.summary-copy {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.summary-label {
  color: #6f7888;
  font-size: 14px;
  white-space: nowrap;
}

.summary-count {
  font-size: 25px;
  line-height: 1;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.summary-icon {
  width: 48px;
  height: 48px;
  border-radius: 9px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
}

.summary-icon svg {
  width: 24px;
  height: 24px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.summary-icon--blue {
  color: #1368ee;
  background: #dbeafe;
}

.summary-icon--green {
  color: #0ba84e;
  background: #dcfce7;
}

.summary-icon--purple {
  color: #8a20ed;
  background: #f3e8ff;
}

.summary-icon--orange {
  color: #f25f15;
  background: #ffedd5;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 30px 22px;
}

.dashboard-panel--wide {
  grid-column: 1 / -1;
}

@media (max-width: 1120px) {
  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 820px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }

  .dashboard-panel--wide {
    grid-column: auto;
  }
}

@media (max-width: 800px) {
  .dashboard-page {
    padding: 24px 18px 40px;
  }
}

@media (max-width: 600px) {
  .summary-grid {
    grid-template-columns: 1fr;
    gap: 14px;
  }

  .summary-card {
    min-height: 96px;
  }
}
</style>
