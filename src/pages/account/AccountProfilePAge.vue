<template>
  <div class="page">
    <div v-if="isLoading" class="loading-state">불러오는 중...</div>

    <!-- 조회 모드 -->
    <div v-else-if="!isEditing">
      <div class="page-header">
        <div>
          <h1 class="page-title">마이페이지</h1>
          <p class="page-sub">내 정보를 확인하고 관리하세요</p>
        </div>
        <button class="btn-edit" @click="startEdit">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
          수정
        </button>
      </div>

      <div class="profile-card">
        <div class="avatar-wrap">
          <div class="avatar">
            <img v-if="profileImageUrl" :src="profileImageUrl" class="avatar-img" />
            <span v-else>{{ nameInitial }}</span>
          </div>
        </div>
        <p class="profile-name">{{ info.name }}</p>

        <div class="info-table">
          <div class="info-row">
            <span class="info-label">이메일</span>
            <span class="info-value">{{ info.email }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">이름</span>
            <span class="info-value">{{ info.name }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">연락처</span>
            <span class="info-value">{{ formatPhoneNumber(info.phone) }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">직종</span>
            <span class="info-value">{{ jobCategoryLabel(info.jobCategory) }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">알림 수신</span>
            <div class="toggle readonly" :class="{ on: info.pushable }">
              <div class="toggle-thumb"></div>
            </div>
          </div>
        </div>

        <button class="btn-logout" @click="handleLogout">로그아웃</button>
        <button class="btn-withdraw" @click="handleWithdraw">회원탈퇴</button>
      </div>
    </div>

    <!-- 수정 모드 -->
    <div v-else>
      <div class="page-header">
        <div>
          <h1 class="page-title">마이페이지 수정</h1>
          <p class="page-sub">내 정보를 수정하세요</p>
        </div>
      </div>

      <div class="profile-card">
        <div class="avatar-wrap">
          <div class="avatar">
            <img
              v-if="previewUrl || profileImageUrl"
              :src="previewUrl || profileImageUrl"
              class="avatar-img"
            />
            <span v-else>{{ nameInitial }}</span>
          </div>
        </div>
        <input
          ref="fileInputRef"
          type="file"
          accept="image/*"
          style="display: none"
          @change="handleFileChange"
        />
        <button class="btn-img-change" @click="triggerFileInput" :disabled="isUploading">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          {{ isUploading ? '업로드 중...' : '프로필 이미지 변경' }}
        </button>

        <div class="form-group">
          <label class="form-label">이메일</label>
          <p class="form-static">{{ info.email }}</p>
        </div>

        <div class="form-group">
          <label class="form-label">이름</label>
          <input v-model="editForm.name" type="text" class="form-input" placeholder="이름" />
        </div>

        <div class="form-group">
          <label class="form-label">연락처</label>
          <PhoneNumberInput v-model="editForm.phone" />
        </div>

        <div class="form-group">
          <label class="form-label">직종</label>
          <select v-model="editForm.jobCategory" class="form-input">
            <option v-for="opt in JOB_CATEGORY_OPTIONS" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </div>

        <div class="form-row">
          <span class="form-label">알림 수신</span>
          <div
            class="toggle"
            :class="{ on: editForm.pushable }"
            @click="editForm.pushable = !editForm.pushable"
          >
            <div class="toggle-thumb"></div>
          </div>
        </div>

        <p v-if="errorMsg" class="error-msg">{{ errorMsg }}</p>

        <div class="btn-row">
          <button class="btn-save" @click="handleSave" :disabled="isSaving">
            {{ isSaving ? '저장 중...' : '저장' }}
          </button>
          <button class="btn-cancel" @click="cancelEdit">취소</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/features/auth/model/authStore.js'
import { getUserMe, updateUserMe, deleteUserMe } from '@/features/account/api/accountApi.js'
import { uploadFile, getFileUrl } from '@/features/file/api/fileApi.js'
import { JOB_CATEGORY_OPTIONS, jobCategoryLabel } from '@/shared/constants/jobCategory.js'
import { formatPhoneNumber } from '@/shared/utils/phoneNumber.js'
import PhoneNumberInput from '@/shared/components/form/PhoneNumberInput.vue'

const router = useRouter()
const authStore = useAuthStore()

const isLoading = ref(true)
const isEditing = ref(false)
const isSaving = ref(false)
const isUploading = ref(false)
const errorMsg = ref('')

const fileInputRef = ref(null)
const previewUrl = ref(null)
const newProfileFileId = ref(null)
const profileImageUrl = ref(null)

const info = reactive({
  email: '',
  name: '',
  phone: '',
  jobCategory: '',
  pushable: false,
  profileFileId: null,
})

const editForm = reactive({ ...info })
const nameInitial = computed(() => info.name?.charAt(0) || '?')

async function fetchMe() {
  isLoading.value = true
  try {
    const res = await getUserMe()
    const data = res.data.data
    Object.assign(info, {
      email: data.email,
      name: data.name,
      phone: data.phone,
      jobCategory: data.jobCategory,
      pushable: data.pushable,
      profileFileId: data.profileFileId,
    })

    if (info.profileFileId) {
      const urlRes = await getFileUrl(info.profileFileId)
      profileImageUrl.value = urlRes.data.data.url || urlRes.data.data
    } else {
      profileImageUrl.value = null
    }

    // 사이드바 등 다른 화면도 즉시 최신 프로필 이미지를 반영하도록 동기화
    authStore.updateProfileImage(profileImageUrl.value)
  } catch (err) {
    errorMsg.value = '내 정보를 불러오지 못했습니다.'
  } finally {
    isLoading.value = false
  }
}

function startEdit() {
  Object.assign(editForm, info)
  previewUrl.value = null
  newProfileFileId.value = null
  isEditing.value = true
}

function cancelEdit() {
  previewUrl.value = null
  newProfileFileId.value = null
  isEditing.value = false
}

function triggerFileInput() {
  fileInputRef.value?.click()
}

async function handleFileChange(e) {
  const file = e.target.files[0]
  if (!file) return

  previewUrl.value = URL.createObjectURL(file)
  isUploading.value = true
  errorMsg.value = ''

  try {
    // 1. TEMP로 업로드
    const res = await uploadFile(file, 'TEMP', null)
    const uploaded = res.data.data
    newProfileFileId.value = Array.isArray(uploaded) ? uploaded[0].fileId : uploaded.fileId
  } catch (err) {
    errorMsg.value = '이미지 업로드에 실패했습니다.'
    previewUrl.value = null
  } finally {
    isUploading.value = false
  }
}

async function handleSave() {
  isSaving.value = true
  errorMsg.value = ''
  try {
    const payload = { ...editForm }

    // 이미지를 새로 업로드한 경우에만 profileFileId를 보냄.
    // 새 이미지가 없으면 기존 profileFileId를 그대로 다시 보내면 안 됨 -
    // 백엔드가 "새 이미지가 왔다"고 오해해서 기존 파일을 삭제 후 같은 ID로
    // 승격을 시도하다가 실패함 (자기 자신을 지우고 자기 자신을 찾는 상황)
    if (newProfileFileId.value) {
      payload.profileFileId = newProfileFileId.value
    } else {
      delete payload.profileFileId
    }

    await updateUserMe(payload)
    await fetchMe()
    isEditing.value = false
  } catch (err) {
    errorMsg.value = err.response?.data?.message || '저장에 실패했습니다.'
  } finally {
    isSaving.value = false
  }
}

function handleLogout() {
  authStore.logout()
  router.push('/login')
}

async function handleWithdraw() {
  if (!confirm('정말 탈퇴하시겠습니까?')) return
  try {
    await deleteUserMe()
    authStore.logout()
    router.push('/login')
  } catch (err) {
    alert(err.response?.data?.message || '탈퇴에 실패했습니다.')
  }
}

onMounted(fetchMe)
</script>

<style scoped>
.page {
  padding: 32px;
  max-width: 100%;
}

.loading-state {
  text-align: center;
  padding: 60px 0;
  color: #9ca3af;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  color: #1a233d;
  margin: 0 0 4px;
}

.page-sub {
  font-size: 14px;
  color: #6c757d;
  margin: 0;
}

.btn-edit {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: #1a233d;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}

.profile-card {
  background: white;
  border-radius: 12px;
  padding: 32px;
  border: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.avatar {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: #d1d5db;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  font-weight: 600;
  color: #6b7280;
  overflow: hidden;
}

.avatar-img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.profile-name {
  font-size: 20px;
  font-weight: 600;
  color: #1a233d;
  margin: 0;
}

.btn-img-change {
  display: flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  color: #6c757d;
  font-size: 13px;
  cursor: pointer;
  margin-top: -8px;
}

.btn-img-change:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.info-table {
  width: 100%;
  display: flex;
  flex-direction: column;
  border-top: 1px solid #f3f4f6;
  border-bottom: 1px solid #f3f4f6;
}

.info-row {
  display: flex;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f3f4f6;
  gap: 16px;
}

.info-row:last-child {
  border-bottom: none;
}

.info-label {
  width: 70px;
  font-size: 13px;
  color: #6c757d;
  flex-shrink: 0;
}

.info-value {
  font-size: 14px;
  color: #1a233d;
  font-weight: 500;
}

.toggle {
  width: 40px;
  height: 22px;
  background: #d1d5db;
  border-radius: 11px;
  position: relative;
  cursor: pointer;
  transition: background 0.2s;
}

.toggle.on {
  background: #1a233d;
}
.toggle.readonly {
  cursor: default;
}

.toggle-thumb {
  width: 18px;
  height: 18px;
  background: white;
  border-radius: 50%;
  position: absolute;
  top: 2px;
  left: 2px;
  transition: left 0.2s;
}

.toggle.on .toggle-thumb {
  left: 20px;
}

.form-group {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-size: 13px;
  font-weight: 500;
  color: #6c757d;
}

.form-static {
  font-size: 14px;
  color: #1a233d;
  margin: 0;
}

.form-input {
  width: 100%;
  height: 40px;
  padding: 0 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 14px;
  color: #1a233d;
  outline: none;
}

.form-input:focus {
  border-color: #1a233d;
}

.form-row {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.error-msg {
  width: 100%;
  font-size: 13px;
  color: #ef4444;
  margin: 0;
}

.btn-row {
  display: flex;
  gap: 12px;
  width: 100%;
}

.btn-save {
  flex: 1;
  height: 44px;
  background: #1a233d;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}

.btn-save:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-cancel {
  flex: 1;
  height: 44px;
  background: white;
  color: #6c757d;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
}

.btn-logout {
  width: 100%;
  height: 44px;
  background: white;
  color: #ef4444;
  border: 1px solid #ef4444;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}

.btn-withdraw {
  background: none;
  border: none;
  color: #9ca3af;
  font-size: 13px;
  cursor: pointer;
  text-decoration: underline;
}
</style>
