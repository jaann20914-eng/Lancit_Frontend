import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import httpClient from '@/shared/api/httpClient.js'

export const useNotificationStore = defineStore('notification', () => {
  const unreadList = ref([])

  const hasUnread = computed(() => unreadList.value.length > 0)

  function hasUnreadByContract(contractId) {
    return unreadList.value.some((n) => n.targetId === contractId)
  }

  function hasUnreadByContractAndType(contractId, ...types) {
    return unreadList.value.some((n) => n.targetId === contractId && types.includes(n.type))
  }

  async function fetchUnread() {
    try {
      const res = await httpClient.get('/notifications')
      const list = res.data.data || []
      // ✅ read로 변경 (백엔드 응답이 "read": false 형태로 옴)
      unreadList.value = list.filter((n) => !n.read)
    } catch (e) {
      console.error('알림 조회 실패', e)
    }
  }

  function addNotification(notification) {
    const exists = unreadList.value.some((n) => n.notificationId === notification.notificationId)
    if (!exists) {
      unreadList.value.unshift(notification)
    }
  }

  function markReadByContractAndType(contractId, ...types) {
    unreadList.value = unreadList.value.filter(
      (n) => !(n.targetId === contractId && types.includes(n.type)),
    )
  }

  function markReadByContract(contractId) {
    unreadList.value = unreadList.value.filter((n) => n.targetId !== contractId)
  }

  return {
    unreadList,
    hasUnread,
    hasUnreadByContract,
    hasUnreadByContractAndType,
    fetchUnread,
    addNotification,
    markReadByContractAndType,
    markReadByContract,
  }
})
