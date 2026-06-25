<template>
  <button
    :type="type"
    :class="[
      'base-button',
      `base-button--${variant}`,
      `base-button--${size}`,
      {
        'base-button--block': block,
        'base-button--loading': loading,
      },
    ]"
    :disabled="disabled || loading"
    v-bind="$attrs"
  >
    <span v-if="$slots.icon" class="base-button__icon" aria-hidden="true">
      <slot name="icon" />
    </span>
    <span class="base-button__content">
      <slot />
    </span>
  </button>
</template>

<script setup>
defineOptions({ inheritAttrs: false })

defineProps({
  type: {
    type: String,
    default: 'button',
  },
  variant: {
    type: String,
    default: 'primary',
    validator: (value) => ['primary', 'secondary', 'outline', 'ghost', 'danger'].includes(value),
  },
  size: {
    type: String,
    default: 'md',
    validator: (value) => ['sm', 'md', 'lg'].includes(value),
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  block: {
    type: Boolean,
    default: false,
  },
})
</script>

<style scoped>
.base-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border: 1px solid transparent;
  border-radius: 6px;
  font-weight: 500;
  line-height: 1;
  white-space: nowrap;
  cursor: pointer;
  transition:
    background-color 0.15s,
    border-color 0.15s,
    color 0.15s,
    opacity 0.15s;
}

.base-button--sm {
  min-height: 34px;
  padding: 0 14px;
  font-size: 12px;
}

.base-button--md {
  min-height: 40px;
  padding: 0 16px;
  font-size: 14px;
}

.base-button--lg {
  min-height: 42px;
  padding: 0 18px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
}

.base-button--primary {
  background: #1a233d;
  color: #ffffff;
}

.base-button--primary:hover:not(:disabled) {
  background: #253a63;
}

.base-button--secondary {
  border-color: #1a233d;
  background: #ffffff;
  color: #1a233d;
}

.base-button--secondary:hover:not(:disabled) {
  background: #f3f4f6;
}

.base-button--outline {
  border-color: #d1d5db;
  background: #ffffff;
  color: #374151;
}

.base-button--outline:hover:not(:disabled) {
  border-color: #1a233d;
  color: #1a233d;
  background: #f9fafb;
}

.base-button--ghost {
  background: transparent;
  color: #6c757d;
}

.base-button--ghost:hover:not(:disabled) {
  background: #f3f4f6;
  color: #1a233d;
}

.base-button--danger {
  border-color: #fee2e2;
  background: #ffffff;
  color: #ef4444;
}

.base-button--danger:hover:not(:disabled) {
  background: #fef2f2;
  border-color: #fecaca;
}

.base-button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.base-button--loading {
  cursor: wait;
}

.base-button--block {
  width: 100%;
  flex: 1 1 0;
}

.base-button__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
}

.base-button__icon :deep(svg) {
  width: 1em;
  height: 1em;
}

.base-button__content {
  min-width: 0;
}
</style>
