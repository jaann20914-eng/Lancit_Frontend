<template>
  <component
    :is="as"
    :class="[
      'base-filter-bar',
      {
        'base-filter-bar--panel': panel,
        'base-filter-bar--flush': flush,
        'base-filter-bar--stacked': stacked,
      },
    ]"
  >
    <div class="base-filter-bar__row">
      <slot />
    </div>
    <div v-if="$slots.secondary" class="base-filter-bar__row base-filter-bar__row--secondary">
      <slot name="secondary" />
    </div>
  </component>
</template>

<script setup>
defineProps({
  as: {
    type: String,
    default: 'div',
  },
  panel: {
    type: Boolean,
    default: false,
  },
  flush: {
    type: Boolean,
    default: false,
  },
  stacked: {
    type: Boolean,
    default: false,
  },
})
</script>

<style scoped>
.base-filter-bar {
  margin-bottom: 20px;
}

.base-filter-bar--panel {
  margin-bottom: 22px;
  padding: 18px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: #ffffff;
}

.base-filter-bar--flush {
  margin-bottom: 0;
}

.base-filter-bar__row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.base-filter-bar__row--secondary {
  margin-top: 10px;
  flex-wrap: wrap;
}

.base-filter-bar--stacked > .base-filter-bar__row {
  flex-wrap: wrap;
}

@media (max-width: 560px) {
  .base-filter-bar__row {
    flex-wrap: wrap;
  }

  .base-filter-bar__row > :deep(*) {
    width: 100%;
  }
}
</style>
