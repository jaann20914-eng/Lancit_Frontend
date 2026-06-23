<template>
  <div class="panel">
    <div class="panel-header">
      <p class="recruitment-title">{{ detail.recruitmentTitle || detail.recruitment_title }}</p>
      <span class="status-badge badge-completed">완료</span>
    </div>

    <!-- 드롭다운: 컨펌 파일 목록 / 계약서 -->
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

    <!-- 컨펌 파일 목록 뷰 -->
    <div v-if="activeView === 'confirm'" class="panel-body">
      <div class="section">
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
            <span class="file-name">파일 #{{ file.fileId }}</span>
            <span class="file-date">{{ formatDate(file.createdAt) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 계약서 뷰: PDF 다운로드 + 실제 계약서 내용 (전체 읽기전용) -->
    <div v-else class="panel-body document-wrap">
      <button v-if="pdfFile" class="btn-download-top" @click="handleDownloadPdf">
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        계약서 PDF 다운로드
      </button>

      <ContractDocumentForm
        :form="documentForm"
        :consent="readonlyConsent"
        :can-edit-company-fields="false"
        :can-edit-freelancer-fields="false"
        :can-edit-consent="false"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { downloadContractPdf } from '@/features/contract/api/contractApi.js'
import { useContractDocumentForm } from '@/features/contract/model/useContractDocumentForm.js'
import ContractDocumentForm from '@/features/contract/ui/ContractDocumentForm.vue'

const props = defineProps({
  detail: { type: Object, required: true },
})

const activeView = ref('confirm')

const contractId = computed(() => props.detail.contractId || props.detail.contract_id)
const document = computed(() => props.detail.document)
const pdfFile = computed(() => props.detail.pdfFile)
const confirmFiles = computed(() => props.detail.confirmFiles || [])

// 계약서 내용을 ContractDocumentForm이 기대하는 form 형태로 변환 (전체 읽기전용)
const { form: documentForm } = useContractDocumentForm(document)

// 동의서는 이미 발송 단계에서 전부 동의 완료된 상태이므로 전부 true로 고정 표시
const readonlyConsent = {
  basic: true,
  unique: true,
  sensitive: true,
  thirdParty: true,
  thirdPartyUnique: true,
}

function formatDate(dateStr) {
  if (!dateStr) return '-'
  return String(dateStr).slice(0, 10)
}

async function handleDownloadPdf() {
  try {
    const response = await downloadContractPdf(contractId.value)
    const blobUrl = URL.createObjectURL(response.data)
    const el = window.document.createElement('a')
    el.href = blobUrl
    el.download = '근로계약서.pdf'
    window.document.body.appendChild(el)
    el.click()
    window.document.body.removeChild(el)
    URL.revokeObjectURL(blobUrl)
  } catch (err) {
    alert('PDF 다운로드에 실패했습니다.')
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

/* ContractListPage의 완료 뱃지와 동일한 색상 */
.badge-completed {
  background: #f3f4f6;
  color: #374151;
}

/* 드롭다운 탭 */
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
}
.file-date {
  color: #9ca3af;
  font-size: 11px;
}

.document-wrap {
  background: #f4f5f7;
  padding: 16px 16px 24px;
}

.btn-download-top {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 42px;
  background: #1a233d;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  margin-bottom: 16px;
}

.btn-download-top:hover {
  background: #253a63;
}
</style>
