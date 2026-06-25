<template>
  <div class="chat-panel">
    <div class="chat-header">
      <span class="chat-title">채팅</span>
      <span class="chat-room-id">방 #{{ chatRoomId }}</span>
    </div>

    <ChatMessageList
      :messages="messages"
      :current-user-email="currentUserEmail"
      :is-loading="isLoading"
      :is-loading-more="isLoadingMore"
      @edit="handleEditRequest"
      @delete="handleDelete"
      @load-more="handleLoadMore"
    />

    <ChatMessageInput :disabled="!canChat" @send="handleSend" @send-file="handleSendFile" />

    <div v-if="editingMessage" class="edit-modal-overlay" @click.self="cancelEdit">
      <div class="edit-modal">
        <h4 class="edit-modal-title">메시지 수정</h4>
        <textarea
          v-model="editContent"
          class="edit-textarea"
          rows="3"
          @keydown.enter.exact.prevent="confirmEdit"
        ></textarea>
        <div class="edit-modal-actions">
          <button class="btn-cancel-edit" @click="cancelEdit">취소</button>
          <button class="btn-confirm-edit" @click="confirmEdit">수정완료</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import { useAuthStore } from '@/features/auth/model/authStore.js'
import { getMessages, deleteMessage, updateMessage } from '@/features/chat/api/chatApi.js'
import { uploadFile } from '@/features/contract/api/contractApi.js'
import ChatMessageList from '@/features/chat/ui/ChatMessageList.vue'
import ChatMessageInput from '@/features/chat/ui/ChatMessageInput.vue'
import { useGlobalStomp } from '@/features/notification/model/useGlobalStomp.js'

const props = defineProps({
  contractId: { type: [Number, String], required: true },
  chatRoomId: { type: [Number, String], default: null },
  canChat: { type: Boolean, default: true },
})

const authStore = useAuthStore()
const currentUserEmail = computed(() => authStore.email)

const messages = ref([])
const isLoading = ref(false)
const isLoadingMore = ref(false)
const editingMessage = ref(null)
const editContent = ref('')
const cursor = ref(null)
const hasMore = ref(true)
const { onConnected, getClient } = useGlobalStomp()
let subscription = null

let stompClient = null

// ─── REST: 메시지 목록 조회 ───────────────────────────────
async function fetchMessages() {
  if (!props.contractId) return
  isLoading.value = true
  try {
    const res = await getMessages(props.contractId, { size: 30 })
    const list = res.data.data || []
    messages.value = list
    if (list.length > 0) {
      cursor.value = list[0].messageId // 가장 오래된 메시지 ID
    }
    hasMore.value = list.length >= 30
  } catch (err) {
    console.error('메시지 조회 실패', err)
  } finally {
    isLoading.value = false
  }
}

async function handleLoadMore() {
  if (isLoadingMore.value || !hasMore.value || cursor.value == null) return
  isLoadingMore.value = true
  try {
    const res = await getMessages(props.contractId, { cursor: cursor.value, size: 30 })
    const list = res.data.data || []
    if (list.length === 0) {
      hasMore.value = false
      return
    }
    messages.value = [...list, ...messages.value]
    cursor.value = list[0].messageId // 더 이전 메시지 ID로 갱신
    hasMore.value = list.length >= 30
  } catch (err) {
    console.error('이전 메시지 조회 실패', err)
  } finally {
    isLoadingMore.value = false
  }
}

// ─── STOMP 연결 ───────────────────────────────────────────
// function connectStomp() {
//   const token = localStorage.getItem('accessToken')
//   if (!token || !props.chatRoomId) return
//   console.log('token:', token)
//   console.log('chatRoomId:', props.chatRoomId)

//   stompClient = new Client({
//     brokerURL: `ws://localhost:8080/ws-native`,
//     connectHeaders: {
//       Authorization: `Bearer ${token}`,
//     },
//     reconnectDelay: 3000,
//     onConnect: () => {
//       stompClient.subscribe(`/sub/chat/${props.chatRoomId}`, (frame) => {
//         const msg = JSON.parse(frame.body)
//         handleIncomingMessage(msg)
//       })
//     },
//     onStompError: (frame) => {
//       console.error('STOMP 에러', frame)
//     },
//   })

//   stompClient.activate()
// }
function connectStomp() {
  if (!props.chatRoomId) return

  onConnected((client) => {
    subscription = client.subscribe(`/sub/chat/${props.chatRoomId}`, (frame) => {
      const msg = JSON.parse(frame.body)
      handleIncomingMessage(msg)
    })
  })
}

// function disconnectStomp() {
//   if (stompClient) {
//     stompClient.deactivate()
//     stompClient = null
//   }
// }
function disconnectStomp() {
  if (subscription) {
    subscription.unsubscribe()
    subscription = null
  }
}

// ─── 실시간 메시지 수신 처리 ──────────────────────────────
function handleIncomingMessage(msg) {
  const idx = messages.value.findIndex((m) => m.messageId === msg.messageId)
  if (idx !== -1) {
    // 수정/삭제 브로드캐스트
    messages.value[idx] = msg
  } else {
    // 새 메시지
    messages.value.push(msg)
  }
}

// ─── STOMP: 텍스트 메시지 전송 ───────────────────────────
// async function handleSend(content) {
//   if (!stompClient?.connected) return
//   stompClient.publish({
//     destination: '/pub/api/chat/send',
//     body: JSON.stringify({
//       chatRoomId: Number(props.chatRoomId),
//       content,
//     }),
//   })
// }
async function handleSend(content) {
  const client = getClient()
  if (!client?.connected) return
  client.publish({
    destination: '/pub/api/chat/send',
    body: JSON.stringify({
      chatRoomId: Number(props.chatRoomId),
      content,
    }),
  })
}

// ─── STOMP: 파일 메시지 전송 ─────────────────────────────
// async function handleSendFile(file) {
//   try {
//     const uploadRes = await uploadFile(file)
//     const fileId = uploadRes.data.data[0].fileId

//     if (!stompClient?.connected) return
//     stompClient.publish({
//       destination: '/pub/api/chat/file',
//       body: JSON.stringify({
//         chatRoomId: Number(props.chatRoomId),
//         fileId,
//       }),
//     })
//   } catch (err) {
//     alert('파일 업로드에 실패했습니다.')
//   }
// }
async function handleSendFile(file) {
  try {
    const uploadRes = await uploadFile(file)
    const fileId = uploadRes.data.data[0].fileId

    const client = getClient()
    if (!client?.connected) return
    client.publish({
      destination: '/pub/api/chat/file',
      body: JSON.stringify({
        chatRoomId: Number(props.chatRoomId),
        fileId,
      }),
    })
  } catch (err) {
    alert('파일 업로드에 실패했습니다.')
  }
}

// ─── REST: 메시지 수정 ────────────────────────────────────
function handleEditRequest(message) {
  if (message.messageType !== 'TEXT') return
  editingMessage.value = message
  editContent.value = message.message
}

function cancelEdit() {
  editingMessage.value = null
  editContent.value = ''
}

async function confirmEdit() {
  if (!editContent.value.trim()) return
  try {
    await updateMessage(props.contractId, editingMessage.value.messageId, editContent.value.trim())
    // 브로드캐스트로 실시간 반영되므로 로컬 업데이트 불필요
  } catch (err) {
    alert(err.response?.data?.message || '수정에 실패했습니다.')
  }
  cancelEdit()
}

// ─── REST: 메시지 삭제 ────────────────────────────────────
async function handleDelete(message) {
  if (!confirm('이 메시지를 삭제하시겠습니까?')) return
  try {
    await deleteMessage(props.contractId, message.messageId)
    // 브로드캐스트로 실시간 반영되므로 로컬 업데이트 불필요
  } catch (err) {
    alert(err.response?.data?.message || '삭제에 실패했습니다.')
  }
}

// ─── 라이프사이클 ─────────────────────────────────────────
onMounted(async () => {
  await fetchMessages()
  connectStomp()
})

onUnmounted(() => {
  disconnectStomp()
})

watch(
  () => props.chatRoomId,
  (newId, oldId) => {
    if (newId && newId !== oldId) {
      disconnectStomp()
      messages.value = []
      cursor.value = null
      hasMore.value = true
      fetchMessages()
      connectStomp()
    }
  },
)
</script>

<style scoped>
.chat-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 20px;
  border-bottom: 1px solid #e5e7eb;
}

.chat-title {
  font-size: 15px;
  font-weight: 700;
  color: #1a233d;
}

.chat-room-id {
  font-size: 11px;
  color: #d1d5db;
}

.edit-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.edit-modal {
  background: white;
  border-radius: 12px;
  padding: 20px;
  width: 360px;
  max-width: 90vw;
}

.edit-modal-title {
  font-size: 14px;
  font-weight: 700;
  color: #1a233d;
  margin: 0 0 12px;
}

.edit-textarea {
  width: 100%;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 10px;
  font-size: 13px;
  font-family: inherit;
  resize: vertical;
  outline: none;
  box-sizing: border-box;
}

.edit-textarea:focus {
  border-color: #1a233d;
}

.edit-modal-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.btn-cancel-edit {
  flex: 1;
  height: 36px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 13px;
  color: #6c757d;
  cursor: pointer;
}

.btn-confirm-edit {
  flex: 1.5;
  height: 36px;
  background: #1a233d;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}
</style>
