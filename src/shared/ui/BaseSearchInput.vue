<template>
  <div class="base-search-input">
    <svg
      v-if="withIcon"
      class="base-search-input__icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
    <input
      :value="modelValue"
      :type="type"
      class="base-search-input__control"
      :class="{ 'base-search-input__control--with-icon': withIcon }"
      :placeholder="placeholder"
      :disabled="disabled"
      v-bind="$attrs"
      @input="handleInput"
      @keyup.enter="emit('search')"
    />
  </div>
</template>

<script setup>
defineOptions({ inheritAttrs: false })

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  placeholder: {
    type: String,
    default: '검색어를 입력하세요',
  },
  type: {
    type: String,
    default: 'search',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  withIcon: {
    type: Boolean,
    default: true,
  },
  modelModifiers: {
    type: Object,
    default: () => ({}),
  },
})

const emit = defineEmits(['update:modelValue', 'search'])

function handleInput(event) {
  const value = event.target.value
  emit('update:modelValue', props.modelModifiers.trim ? value.trim() : value)
}
</script>

<style scoped>
.base-search-input {
  position: relative;
  min-width: 0;
  flex: 1 1 auto;
  display: flex;
  align-items: center;
}

.base-search-input__icon {
  position: absolute;
  left: 12px;
  width: 16px;
  height: 16px;
  color: #9ca3af;
  pointer-events: none;
}

.base-search-input__control {
  width: 100%;
  height: 40px;
  padding: 0 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #ffffff;
  color: #1a233d;
  font: inherit;
  font-size: 14px;
  outline: none;
  transition:
    border-color 0.15s,
    box-shadow 0.15s,
    opacity 0.15s;
}

.base-search-input__control--with-icon {
  padding-left: 36px;
}

.base-search-input__control::placeholder {
  color: #9ca3af;
}

.base-search-input__control:focus {
  border-color: #1a233d;
}

.base-search-input__control:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
</style>
