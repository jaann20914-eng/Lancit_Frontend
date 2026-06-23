<template>
  <div class="signature-field" :class="{ compact: compact }">
    <label v-if="label" class="form-label">{{ label }}</label>

    <!-- 서명 목록 -->
    <div v-if="signatures" class="signature-list">
      <div class="signature-thumb">
        <img :src="signatureUrl" />
        <button v-if="editable" class="thumb-remove" @click="removeSignature">×</button>
      </div>
    </div>

    <!-- 서명 추가 버튼 - 미작성(warning) 상태면 노란 배경으로 표시 -->
    <button
      v-if="editable"
      :class="['btn-add-signature', warning ? 'btn-add-signature-warning' : '']"
      @click="openModal"
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <path d="M12 19l7-7 3 3-7 7-3-3z" />
        <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
        <path d="M2 2l7.586 7.586" />
        <circle cx="11" cy="11" r="2" />
      </svg>
      서명 추가
      <span v-if="warning" class="warning-dot"></span>
    </button>

    <!-- 모달 -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal">
        <h3 class="modal-title">전자서명</h3>

        <!-- 탭: 직접 서명 / 이미지 업로드 -->
        <div class="modal-tabs">
          <button :class="['modal-tab', mode === 'draw' ? 'active' : '']" @click="mode = 'draw'">
            직접 서명
          </button>
          <button
            :class="['modal-tab', mode === 'upload' ? 'active' : '']"
            @click="mode = 'upload'"
          >
            이미지 업로드
          </button>
        </div>

        <!-- 직접 서명 -->
        <div v-if="mode === 'draw'" class="draw-area">
          <Vue3Signature
            ref="signatureRef"
            :w="'400px'"
            :h="'180px'"
            :sigOption="sigOption"
            class="signature-canvas"
          />
        </div>

        <!-- 이미지 업로드 -->
        <div v-else class="upload-area">
          <input
            ref="fileInputRef"
            type="file"
            accept="image/*"
            style="display: none"
            @change="handleFileChange"
          />
          <div v-if="!uploadPreview" class="upload-dropzone" @click="fileInputRef?.click()">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#9CA3AF"
              stroke-width="1.5"
            >
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <p>클릭하여 서명 이미지를 업로드하세요</p>
          </div>
          <div v-else class="upload-preview">
            <img :src="uploadPreview" />
            <button class="btn-reupload" @click="fileInputRef?.click()">다시 선택</button>
          </div>
        </div>

        <div class="modal-actions">
          <button class="btn-cancel" @click="closeModal">취소</button>
          <button v-if="mode === 'draw'" class="btn-clear" @click="clearCanvas">지우기</button>
          <button class="btn-confirm" @click="confirmSignature">서명완료</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import Vue3Signature from 'vue3-signature'
import { uploadFile, getFileUrl } from '@/features/file/api/fileApi'
import { dataURLtoFile } from '@/shared/utils/fileUtils'

const props = defineProps({
  label: { type: String, default: '서명' },
  modelValue: {
    type: Number,
    default: null,
  }, // [{ fileId, previewUrl }, ...]
  editable: { type: Boolean, default: true },
  compact: { type: Boolean, default: false },
  // true면 "아직 서명 안 함" 경고 상태 - 버튼 배경을 노란색으로 표시
  warning: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue'])

const signatures = computed({
  get: () => props.modelValue,
  set: (val) => {
    console.log('emit 발생', val)
    emit('update:modelValue', val)
  },
})

const showModal = ref(false)
const mode = ref('draw')
const signatureRef = ref(null)
const fileInputRef = ref(null)
const uploadPreview = ref(null)
const uploadTargetFile = ref(null)
const signatureUrl = ref(null)

const sigOption = {
  penColor: 'rgb(26, 35, 61)',
  backgroundColor: 'rgb(255,255,255)',
}

const canConfirm = computed(() => {
  if (mode.value === 'draw') {
    return signatureRef.value && !signatureRef.value.isEmpty()
  }

  return !!uploadTargetFile.value
})

function openModal() {
  mode.value = 'draw'
  uploadPreview.value = null
  uploadTargetFile.value = null
  showModal.value = true
}

function closeModal() {
  showModal.value = false
}

function clearCanvas() {
  signatureRef.value?.clear()
}

function handleFileChange(e) {
  const file = e.target.files[0]
  if (!file) return
  uploadTargetFile.value = file
  uploadPreview.value = URL.createObjectURL(file)
}
function loadSignatureUrl() {
  if (!signatures.value) return

  getFileUrl(signatures.value).then((res) => {
    signatureUrl.value = res.data.data
  })
}
watch(
  signatures,
  () => {
    loadSignatureUrl()
  },
  {
    immediate: true,
  },
)

async function confirmSignature() {
  try {
    let file
    if (mode.value === 'draw' && signatureRef.value.isEmpty()) {
      alert('서명을 입력해주세요')
      return
    }

    if (mode.value === 'draw') {
      const dataUrl = signatureRef.value.save('image/png')
      file = dataURLtoFile(dataUrl, `signature-${Date.now()}.png`)
    } else {
      file = uploadTargetFile.value
    }

    const response = await uploadFile(file, 'TEMP_SIGNATURE')

    const uploaded = response.data.data[0]

    signatures.value = uploaded.fileId
    getFileUrl(uploaded.fileId).then((res) => {
      signatureUrl.value = res.data.data
    })

    console.log('업로드 완료', uploaded.fileId)
    console.log('현재 modelValue', signatures.value)

    closeModal()
  } catch (error) {
    console.error(error)
    alert('서명 업로드 실패')
  }
}

function removeSignature() {
  if (!confirm('이 서명을 삭제하시겠습니까?')) return

  signatures.value = null
  signatureUrl.value = null
}
</script>

<style scoped>
.signature-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.signature-field.compact {
  flex-direction: row;
  align-items: center;
  gap: 6px;
}

.signature-field.compact .signature-list {
  gap: 4px;
}
.signature-field.compact .signature-thumb {
  width: 60px;
  height: 28px;
}
.signature-field.compact .btn-add-signature {
  width: auto;
  height: 26px;
  padding: 0 10px;
  font-size: 11px;
}

.form-label {
  font-size: 12px;
  font-weight: 500;
  color: #6c757d;
}

.signature-list {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.signature-thumb {
  position: relative;
  width: 100px;
  height: 50px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  overflow: hidden;
  background: white;
}

.signature-thumb img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.thumb-remove {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: rgba(239, 68, 68, 0.9);
  color: white;
  border: none;
  font-size: 11px;
  line-height: 1;
  cursor: pointer;
}

.btn-add-signature {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  height: 38px;
  background: white;
  border: 1px dashed #d1d5db;
  border-radius: 6px;
  font-size: 12px;
  color: #6c757d;
  cursor: pointer;
}

.btn-add-signature:hover {
  border-color: #1a233d;
  color: #1a233d;
}

/* 아직 서명을 작성하지 않은 경우 - 버튼 배경 자체를 노란색으로 표시 (보더라인 대신) */
.btn-add-signature-warning {
  background: rgba(251, 191, 36, 0.18);
  border: 1px dashed #f59e0b;
  color: #92400e;
}

.btn-add-signature-warning:hover {
  background: rgba(251, 191, 36, 0.28);
  border-color: #d97706;
  color: #92400e;
}

.warning-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #ef4444;
  flex-shrink: 0;
}

/* 모달 */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: 14px;
  padding: 24px;
  width: 440px;
  max-width: 90vw;
}

.modal-title {
  font-size: 16px;
  font-weight: 700;
  color: #1a233d;
  margin: 0 0 14px;
}

.modal-tabs {
  display: flex;
  gap: 6px;
  margin-bottom: 14px;
}

.modal-tab {
  flex: 1;
  height: 32px;
  border-radius: 999px;
  border: 1px solid #e5e7eb;
  background: white;
  color: #6c757d;
  font-size: 12px;
  cursor: pointer;
}

.modal-tab.active {
  background: #1a233d;
  color: white;
  border-color: #1a233d;
}

.draw-area {
  display: flex;
  justify-content: center;
  margin-bottom: 14px;
}

.signature-canvas {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.upload-area {
  margin-bottom: 14px;
}

.upload-dropzone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 180px;
  border: 1px dashed #d1d5db;
  border-radius: 8px;
  cursor: pointer;
  color: #9ca3af;
  font-size: 12px;
}

.upload-dropzone:hover {
  border-color: #1a233d;
}

.upload-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.upload-preview img {
  max-width: 100%;
  max-height: 160px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.btn-reupload {
  background: none;
  border: none;
  color: #1a233d;
  font-size: 12px;
  text-decoration: underline;
  cursor: pointer;
}

.modal-actions {
  display: flex;
  gap: 8px;
}

.btn-cancel,
.btn-clear {
  flex: 1;
  height: 38px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 13px;
  color: #6c757d;
  cursor: pointer;
}

.btn-confirm {
  flex: 1.5;
  height: 38px;
  background: #1a233d;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.btn-confirm:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
