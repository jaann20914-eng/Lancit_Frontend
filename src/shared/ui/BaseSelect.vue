<template>
  <select
    :value="modelValue"
    :class="['base-select', `base-select--${size}`]"
    :disabled="disabled"
    :style="selectStyle"
    v-bind="$attrs"
    @change="handleChange"
  >
    <option
      v-for="option in options"
      :key="String(option.value)"
      :value="option.value"
      :disabled="option.disabled"
    >
      {{ option.label }}
    </option>
    <slot />
  </select>
</template>

<script setup>
import { computed } from 'vue'

defineOptions({ inheritAttrs: false })

const props = defineProps({
  modelValue: {
    type: [String, Number, Boolean],
    default: '',
  },
  options: {
    type: Array,
    default: () => [],
  },
  size: {
    type: String,
    default: 'md',
    validator: (value) => ['sm', 'md'].includes(value),
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  width: {
    type: String,
    default: '',
  },
  minWidth: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:modelValue', 'change'])

const selectStyle = computed(() => ({
  width: props.width || undefined,
  minWidth: props.minWidth || undefined,
}))

function handleChange(event) {
  emit('update:modelValue', event.target.value)
  emit('change', event)
}
</script>

<style scoped>
.base-select {
  height: 40px;
  padding: 0 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #ffffff;
  color: #1a233d;
  font: inherit;
  font-size: 13px;
  outline: none;
  cursor: pointer;
  flex: 0 0 auto;
  transition:
    border-color 0.15s,
    box-shadow 0.15s,
    opacity 0.15s;
}

.base-select--sm {
  height: 34px;
  font-size: 12px;
}

.base-select:focus {
  border-color: #1a233d;
}

.base-select:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
</style>
