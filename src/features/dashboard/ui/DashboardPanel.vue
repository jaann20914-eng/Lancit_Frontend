<template>
  <section class="dashboard-panel">
    <header class="panel-header">
      <h2>{{ panel.title }}</h2>
      <RouterLink :to="panel.to" class="panel-more">
        전체보기
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="m9 18 6-6-6-6" />
        </svg>
      </RouterLink>
    </header>

    <div
      v-if="panel.items.length"
      :class="['panel-list', { 'portfolio-grid': panel.type === 'portfolio' }]"
    >
      <template v-if="panel.type === 'portfolio'">
        <PortfolioCard
          v-for="item in panel.items"
          :key="item.portfolio.portfolioId"
          :portfolio="item.portfolio"
          :banner-url="item.bannerUrl"
          readonly
          @view="goToPortfolio"
        />
      </template>

      <template v-else>
        <RouterLink
          v-for="item in panel.items"
          :key="item.key || `${panel.title}-${item.title}`"
          :to="item.to || panel.to"
          class="panel-item"
        >
          <div class="item-main">
            <div class="item-title-row">
              <strong>{{ item.title }}</strong>
              <span
                v-if="item.badge"
                :class="['item-badge', `item-badge--${item.badgeTone || 'blue'}`]"
              >
                {{ item.badge }}
              </span>
            </div>
            <p v-if="item.subtitle" class="item-subtitle">{{ item.subtitle }}</p>
            <p v-if="item.meta" class="item-meta">
              <svg v-if="item.metaIcon === 'calendar'" viewBox="0 0 24 24" aria-hidden="true">
                <rect x="3" y="5" width="18" height="16" rx="2" />
                <path d="M16 3v4M8 3v4M3 10h18" />
              </svg>
              {{ item.meta }}
            </p>
          </div>
          <span v-if="item.trailing" class="item-trailing">{{ item.trailing }}</span>
        </RouterLink>
      </template>
    </div>

    <div v-else class="panel-empty">
      <p>{{ panel.emptyMessage || '표시할 항목이 없습니다.' }}</p>
    </div>
  </section>
</template>

<script setup>
import { useRouter } from 'vue-router'
import PortfolioCard from '@/features/portfolio/ui/PortfolioCard.vue'

const router = useRouter()

defineProps({
  panel: {
    type: Object,
    required: true,
  },
})

function goToPortfolio(portfolio) {
  router.push({ name: 'PortfolioDetail', params: { id: portfolio.portfolioId } })
}
</script>

<style scoped>
.dashboard-panel {
  min-width: 0;
  overflow: hidden;
  border: 1px solid #e1e4e9;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 2px 4px rgba(26, 35, 61, 0.11);
}

.panel-header {
  min-height: 82px;
  padding: 0 24px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}

.panel-header h2 {
  margin: 0;
  font-size: 17px;
  font-weight: 600;
  letter-spacing: -0.025em;
}

.panel-more {
  color: #25324b;
  font-size: 13px;
  font-weight: 500;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
}

.panel-more:hover {
  color: #2563eb;
}

.panel-more svg {
  width: 16px;
  height: 16px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.panel-list {
  padding: 24px 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.portfolio-grid {
  grid-template-columns: repeat(4, minmax(0, 1fr));
  display: grid;
  gap: 16px;
}

.panel-item {
  min-width: 0;
  min-height: 92px;
  padding: 15px 16px;
  border: 1px solid #dfe3e8;
  border-radius: 8px;
  background: #fafbfc;
  color: inherit;
  text-decoration: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  transition:
    border-color 0.15s ease,
    background-color 0.15s ease;
}

.panel-item:hover {
  border-color: #c7d2e1;
  background: #f7f9fc;
}

.panel-item:focus-visible {
  outline: 3px solid rgba(59, 130, 246, 0.2);
  outline-offset: 1px;
}

.item-main {
  min-width: 0;
  flex: 1;
}

.item-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.item-title-row strong {
  overflow: hidden;
  font-size: 15px;
  font-weight: 500;
  line-height: 1.45;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-badge {
  padding: 3px 8px;
  border: 1px solid transparent;
  border-radius: 6px;
  font-size: 11px;
  line-height: 1.3;
  flex: 0 0 auto;
}

.item-badge--green {
  color: #148044;
  border-color: #b9edcd;
  background: #dcfce7;
}

.item-badge--blue {
  color: #2563d9;
  border-color: #bed7ff;
  background: #dbeafe;
}

.item-badge--purple {
  color: #7e22ce;
  border-color: #e2c5fb;
  background: #f3e8ff;
}

.item-badge--orange {
  color: #c2410c;
  border-color: #fed7aa;
  background: #ffedd5;
}

.item-badge--gray {
  color: #4b5563;
  border-color: #d1d5db;
  background: #f3f4f6;
}

.item-subtitle,
.item-meta {
  margin: 6px 0 0;
  color: #6f7888;
  font-size: 13px;
  line-height: 1.35;
}

.item-meta {
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 5px;
}

.item-meta svg {
  width: 13px;
  height: 13px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.item-trailing {
  color: #7b8494;
  font-size: 12px;
  white-space: nowrap;
}

.panel-empty {
  min-height: 240px;
  color: #8a93a1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.panel-empty p {
  margin: 0;
  font-size: 13px;
}

@media (max-width: 600px) {
  .panel-header {
    min-height: 72px;
    padding: 0 18px;
  }

  .panel-list {
    padding: 18px 12px;
  }

  .portfolio-grid {
    grid-template-columns: 1fr;
  }

  .panel-item {
    min-height: 88px;
    padding: 14px;
  }
}
</style>
