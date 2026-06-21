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

    <!-- 수정 모달 -->
    <div v-if="editingMessage" class="edit-modal-overlay" @click.self="cancelEdit">
      <div class="edit-modal">
        <h4 class="edit-modal-title">메시지 수정</h4>
        <textarea v-model="editContent" class="edit-textarea" rows="3"></textarea>
        <div class="edit-modal-actions">
          <button class="btn-cancel-edit" @click="cancelEdit">취소</button>
          <button class="btn-confirm-edit" @click="confirmEdit">수정완료</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useAuthStore } from '@/features/auth/model/authStore.js'
import ChatMessageList from '@/features/chat/ui/ChatMessageList.vue'
import ChatMessageInput from '@/features/chat/ui/ChatMessageInput.vue'

const props = defineProps({
  contractId: { type: [Number, String], required: true },
  chatRoomId: { type: [Number, String], default: null },
  canChat: { type: Boolean, default: true }, // CANCELLED 상태 등에서 false
})

const authStore = useAuthStore()
const currentUserEmail = computed(() => authStore.email)

const messages = ref([])
const isLoading = ref(false)
const isLoadingMore = ref(false)
const editingMessage = ref(null)
const editContent = ref('')

// ════════════════════════════════════════════
// 더미 데이터 (백엔드 연동 전 화면 확인용)
// "나"는 항상 현재 로그인한 계정(currentUserEmail) 기준으로 잡아야
// 좌우 정렬이 실제 로그인 상태와 일치함
// ════════════════════════════════════════════
function buildMockMessages() {
  const me = currentUserEmail.value || 'jane@example.com'
  const opponent = me === 'company@example.com' ? 'jane@example.com' : 'company@example.com'

  const base = new Date('2026-06-10T14:08:00')
  const addMin = (min) => new Date(base.getTime() + min * 60000).toISOString()

  return [
    {
      messageId: 1,
      senderEmail: opponent,
      messageType: 'TEXT',
      message: '재밌 보내기 재밌 보내기 재밌 재밌\n재밌재밌',
      isDeleted: false,
      isUpdated: false,
      createdAt: addMin(0),
    },
    {
      messageId: 2,
      senderEmail: me,
      messageType: 'FILE',
      fileId: 201,
      fileName: '파일 이름.pdf',
      fileSize: '2.40MB',
      isDeleted: false,
      isUpdated: false,
      createdAt: addMin(2),
    },
    {
      messageId: 3,
      senderEmail: me,
      messageType: 'TEXT',
      message: '재밌 보내기 재밌 보내기 재밌 재밌\n재밌재밌재밌 재밌재밌',
      isDeleted: false,
      isUpdated: false,
      createdAt: addMin(2),
    },
    {
      messageId: 4,
      senderEmail: opponent,
      messageType: 'TEXT',
      message: '(삭제된 메세지입니다)',
      isDeleted: true,
      isUpdated: false,
      createdAt: addMin(3),
    },
    {
      messageId: 5,
      senderEmail: me,
      messageType: 'TEXT',
      message: '재밌 보내기 재밌 보내기 재밌 재밌',
      isDeleted: false,
      isUpdated: true,
      createdAt: addMin(61),
    },
  ]
}

async function fetchMessages() {
  isLoading.value = true
  try {
    // TODO: 백엔드 연동 시 getMessages(contractId) 로 교체
    await new Promise((r) => setTimeout(r, 300))
    messages.value = buildMockMessages()
  } finally {
    isLoading.value = false
  }
}

// currentUserEmail이 늦게 채워지는 경우(authStore 초기화 타이밍) 대비
watch(currentUserEmail, (val) => {
  if (val && messages.value.length === 0) {
    fetchMessages()
  }
})

async function handleLoadMore() {
  if (isLoadingMore.value) return
  // TODO: 백엔드 연동 시 cursor 기반 이전 메시지 추가 로드
}

async function handleSend(content) {
  // TODO: 백엔드 연동 시 STOMP sendChatMessage(chatRoomId, content) 로 교체
  const newMsg = {
    messageId: Date.now(),
    senderEmail: currentUserEmail.value,
    messageType: 'TEXT',
    message: content,
    isDeleted: false,
    isUpdated: false,
    createdAt: new Date().toISOString(),
  }
  messages.value.push(newMsg)
}

async function handleSendFile(file) {
  // TODO: 백엔드 연동 시 파일 업로드 후 STOMP sendChatFile(chatRoomId, fileId) 로 교체
  const newMsg = {
    messageId: Date.now(),
    senderEmail: currentUserEmail.value,
    messageType: 'FILE',
    fileId: Math.floor(Math.random() * 100000),
    fileName: file.name,
    fileSize: formatFileSize(file.size),
    isDeleted: false,
    isUpdated: false,
    createdAt: new Date().toISOString(),
  }
  messages.value.push(newMsg)
}

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + 'B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + 'KB'
  return (bytes / (1024 * 1024)).toFixed(2) + 'MB'
}

// 텍스트 메시지만 수정 가능 (파일 메시지는 수정 UI 자체를 ChatMessageItem에서 막음)
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
  // TODO: 백엔드 연동 시 updateMessage(contractId, messageId, content) 로 교체
  const target = messages.value.find((m) => m.messageId === editingMessage.value.messageId)
  if (target) {
    target.message = editContent.value.trim()
    target.isUpdated = true
  }
  cancelEdit()
}

async function handleDelete(message) {
  if (!confirm('이 메시지를 삭제하시겠습니까?')) return
  // TODO: 백엔드 연동 시 deleteMessage(contractId, messageId) 로 교체
  const target = messages.value.find((m) => m.messageId === message.messageId)
  if (target) {
    target.isDeleted = true
  }
}

onMounted(fetchMessages)
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

/* 수정 모달 */
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
