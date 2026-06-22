<template>
  <div class="panel">
    <div class="panel-header">
      <p class="recruitment-title">{{ detail.recruitmentTitle || detail.recruitment_title }}</p>
      <span class="status-badge badge-cancelled">파기됨</span>
    </div>

    <div class="dropdown-tabs">
      <button
        :class="['dropdown-tab', activeView === 'confirm' ? 'active' : '']"
        @click="activeView = 'confirm'"
      >
        컨펌 파일 목록
      </button>
      <button
        :class="['dropdown-tab', activeView === 'document' ? 'active' : '']"
        @click="activeView = 'document'"
      >
        계약서
      </button>
    </div>

    <div v-if="activeView === 'confirm'" class="panel-body">
      <div class="section">
        <span class="section-title">컨펌 파일 목록</span>
        <div v-if="!confirmFiles.length" class="empty-mini">업로드된 파일이 없습니다</div>
        <div v-else class="file-list">
          <div v-for="file in confirmFiles" :key="file.contractFileId" class="file-item">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            <span class="file-name" @click="handleDownloadFile(file.fileId, file.oriName)">
              {{ file.oriName || `파일_${file.fileId}` }}
            </span>
            <span class="file-date">{{ formatDate(file.createdAt) }}</span>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="panel-body">
      <div class="cancelled-body">
        <svg
          width="40"
          height="40"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#EF4444"
          stroke-width="1.5"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
        <p class="cancelled-text">파기된 계약입니다</p>
        <p class="cancelled-sub">이 계약은 더 이상 진행되지 않습니다</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { getFileDownloadUrl } from '@/features/contract/api/contractApi.js'

const props = defineProps({
  detail: { type: Object, required: true },
})

const activeView = ref('confirm')
const confirmFiles = computed(() => props.detail.confirmFiles || [])

function formatDate(dateStr) {
  if (!dateStr) return '-'
  return String(dateStr).slice(0, 10)
}

async function handleDownloadFile(fileId, oriName) {
  try {
    const response = await getFileDownloadUrl(fileId)
    const blobUrl = URL.createObjectURL(response.data)
    const a = window.document.createElement('a')
    a.href = blobUrl
    a.download = oriName || `파일_${fileId}`
    window.document.body.appendChild(a)
    a.click()
    window.document.body.removeChild(a)
    URL.revokeObjectURL(blobUrl)
  } catch (err) {
    alert('파일 다운로드에 실패했습니다.')
  }
}
</script>

<style scoped>
.panel {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.panel-header {
  padding: 18px 20px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.recruitment-title {
  font-size: 15px;
  font-weight: 600;
  color: #1a233d;
  margin: 0;
}
.status-badge {
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
}
.badge-cancelled {
  background: #fee2e2;
  color: #991b1b;
}

.dropdown-tabs {
  display: flex;
  border-bottom: 1px solid #e5e7eb;
}
.dropdown-tab {
  flex: 1;
  padding: 10px;
  font-size: 13px;
  font-weight: 500;
  color: #9ca3af;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  cursor: pointer;
}
.dropdown-tab.active {
  color: #1a233d;
  border-bottom-color: #1a233d;
  font-weight: 600;
}

.panel-body {
  flex: 1;
  overflow-y: auto;
}
.section {
  padding: 14px 20px;
}
.section-title {
  font-size: 13px;
  font-weight: 600;
  color: #1a233d;
  display: block;
  margin-bottom: 10px;
}
.empty-mini {
  font-size: 12px;
  color: #d1d5db;
  text-align: center;
  padding: 12px 0;
}

.file-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.file-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  background: #f9fafb;
  border-radius: 6px;
  font-size: 12px;
  color: #1a233d;
}
.file-name {
  flex: 1;
  cursor: pointer;
  text-decoration: underline;
}
.file-date {
  color: #9ca3af;
  font-size: 11px;
}

.cancelled-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 8px;
  padding: 60px 24px;
}
.cancelled-text {
  font-size: 14px;
  font-weight: 600;
  color: #1a233d;
  margin: 0;
}
.cancelled-sub {
  font-size: 12px;
  color: #9ca3af;
  margin: 0;
}
</style>
