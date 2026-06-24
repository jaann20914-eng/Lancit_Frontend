<template>
  <RouterView />
</template>

<script setup>
import { watch } from 'vue'
import { useAuthStore } from '@/features/auth/model/authStore.js'
import { useGlobalStomp } from '@/features/notification/model/useGlobalStomp.js'
import { useNotificationStore } from '@/features/notification/model/useNotificationStore.js'

const authStore = useAuthStore()
const { connect, disconnect } = useGlobalStomp()
const notificationStore = useNotificationStore()

watch(
  () => authStore.email,
  (email) => {
    if (email) {
      notificationStore.fetchUnread()
      connect(email)
    } else {
      disconnect()
    }
  },
  { immediate: true },
)
</script>
