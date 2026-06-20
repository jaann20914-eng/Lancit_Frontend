<template>
  <div class="page">

    <!-- 조회 모드 -->
    <div v-if="!isEditing">
      <div class="page-header">
        <div>
          <h1 class="page-title">마이페이지</h1>
          <p class="page-sub">내 정보를 확인하고 관리하세요</p>
        </div>
        <button class="btn-edit" @click="startEdit">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
          수정
        </button>
      </div>

      <div class="profile-card">
        <!-- 아바타 -->
        <div class="avatar-wrap">
          <div class="avatar">{{ nameInitial }}</div>
        </div>
        <p class="profile-name">{{ info.name }}</p>

        <!-- 정보 테이블 -->
        <div class="info-table">
          <div class="info-row">
            <span class="info-label">이메일</span>
            <span class="info-value">{{ info.email }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">회사명</span>
            <span class="info-value">{{ info.companyName }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">이름</span>
            <span class="info-value">{{ info.name }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">연락처</span>
            <span class="info-value">{{ info.phone }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">업종</span>
            <span class="info-value">{{ jobCategoryLabel(info.jobCategory) }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">알림 수신</span>
            <div class="toggle readonly" :class="{ on: info.pushable }">
              <div class="toggle-thumb"></div>
            </div>
          </div>
          <div class="info-row">
            <span class="info-label">사업자 인증</span>
            <div class="toggle readonly" :class="{ on: info.businessNumberVerified }">
              <div class="toggle-thumb"></div>
            </div>
          </div>
        </div>

        <button class="btn-logout" @click="handleLogout">로그아웃</button>
        <button class="btn-withdraw" @click="handleWithdraw">회원탈퇴</button>
      </div>
    </div>

    <!-- 수정 모드 -->
    <div v-if="isEditing">
      <div class="page-header">
        <div>
          <h1 class="page-title">마이페이지 수정</h1>
          <p class="page-sub">내 정보를 수정하세요</p>
        </div>
      </div>

      <div class="profile-card">
        <!-- 프로필 이미지 변경 -->
        <div class="avatar-wrap">
          <div class="avatar">
            <img v-if="previewUrl" :src="previewUrl" class="avatar-img" />
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
        <button class="btn-img-change" @click="triggerFileInput">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          프로필 이미지 변경
        </button>

        <!-- 이메일 (수정 불가) -->
        <div class="form-group">
          <label class="form-label">이메일</label>
          <p class="form-static">{{ info.email }}</p>
        </div>

        <div class="form-group">
          <label class="form-label">회사명</label>
          <input v-model="editForm.companyName" type="text" class="form-input" placeholder="회사이름" />
        </div>

        <div class="form-group">
          <label class="form-label">이름</label>
          <input v-model="editForm.name" type="text" class="form-input" placeholder="회사측 가입자명" />
        </div>

        <div class="form-group">
          <label class="form-label">연락처</label>
          <input v-model="editForm.phone" type="tel" class="form-input" placeholder="010-1234-5678" />
        </div>

        <div class="form-group">
          <label class="form-label">업종</label>
          <select v-model="editForm.jobCategory" class="form-input">
            <option v-for="opt in JOB_CATEGORY_OPTIONS" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </div>

        <div class="form-row">
          <span class="form-label">알림 수신</span>
          <div class="toggle" :class="{ on: editForm.pushable }" @click="editForm.pushable = !editForm.pushable">
            <div class="toggle-thumb"></div>
          </div>
        </div>

        <!-- 사업자 번호 인증 -->
        <button class="btn-outline" @click="verifyBusiness">
          사업자 번호 인증하기
        </button>

        <div class="btn-row">
          <button class="btn-save" @click="handleSave" :disabled="isLoading">
            {{ isLoading ? '저장 중...' : '저장' }}
          </button>
          <button class="btn-cancel" @click="cancelEdit">취소</button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/features/auth/model/authStore.js'
import { JOB_CATEGORY_OPTIONS, jobCategoryLabel } from '@/shared/constants/jobCategory.js'

const router = useRouter()
const authStore = useAuthStore()

const isEditing = ref(false)
const isLoading = ref(false)
const fileInputRef = ref(null)
const previewUrl = ref(null)
const selectedFile = ref(null)

// 임시 더미 데이터 (API 연동 시 교체)
const info = reactive({
  email: authStore.email || 'company@example.com',
  name: '회사측가입자명',
  companyName: '회사이름',
  phone: '010-1234-5678',
  jobCategory: 'DESIGN',
  pushable: false,
  businessNumberVerified: true
})

const editForm = reactive({ ...info })

const nameInitial = computed(() => info.name?.charAt(0) || '회')

function startEdit() {
  Object.assign(editForm, info)
  previewUrl.value = null
  selectedFile.value = null
  isEditing.value = true
}

function cancelEdit() {
  previewUrl.value = null
  selectedFile.value = null
  isEditing.value = false
}

function triggerFileInput() {
  fileInputRef.value?.click()
}

function handleFileChange(e) {
  const file = e.target.files[0]
  if (!file) return

  selectedFile.value = file
  previewUrl.value = URL.createObjectURL(file)

  // TODO: 파일을 TEMP로 업로드 → fileId 받아서 저장 시 profileFileId로 전달
  // const uploaded = await uploadFile(file, 'TEMP')
}

function verifyBusiness() {
  // TODO: 사업자번호 인증 API 연동
  alert('사업자번호 인증 기능은 추후 연동됩니다.')
}

function togglePushable() {
  info.pushable = !info.pushable
}

async function handleSave() {
  isLoading.value = true
  try {
    // TODO: await updateCompany(editForm)
    Object.assign(info, editForm)
    isEditing.value = false
  } catch (err) {
    alert('저장에 실패했습니다.')
  } finally {
    isLoading.value = false
  }
}

function handleLogout() {
  authStore.logout()
  router.push('/login')
}

function handleWithdraw() {
  if (confirm('정말 탈퇴하시겠습니까?')) {
    // TODO: await withdrawCompany()
    authStore.logout()
    router.push('/login')
  }
}
</script>

<style scoped>
.page {
  padding: 32px;
  max-width: 680px;
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
  color: #1A233D;
  margin: 0 0 4px;
}

.page-sub {
  font-size: 14px;
  color: #6C757D;
  margin: 0;
}

.btn-edit {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: #1A233D;
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
  border: 1px solid #E5E7EB;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.avatar-wrap { position: relative; }

.avatar {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: #D1D5DB;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  font-weight: 600;
  color: #6B7280;
  overflow: hidden;
}

.profile-name {
  font-size: 20px;
  font-weight: 600;
  color: #1A233D;
  margin: 0;
}

.btn-img-change {
  display: flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  color: #6C757D;
  font-size: 13px;
  cursor: pointer;
  margin-top: -8px;
}

/* 정보 테이블 */
.info-table {
  width: 100%;
  display: flex;
  flex-direction: column;
  border-top: 1px solid #F3F4F6;
  border-bottom: 1px solid #F3F4F6;
}

.info-row {
  display: flex;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #F3F4F6;
  gap: 16px;
}

.info-row:last-child { border-bottom: none; }

.info-label {
  width: 80px;
  font-size: 13px;
  color: #6C757D;
  flex-shrink: 0;
}

.info-value {
  font-size: 14px;
  color: #1A233D;
  font-weight: 500;
}

/* 토글 */
.toggle {
  width: 40px;
  height: 22px;
  background: #D1D5DB;
  border-radius: 11px;
  position: relative;
  cursor: pointer;
  transition: background 0.2s;
}

.toggle.on { background: #1A233D; }
.toggle.readonly { cursor: default; }

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

.toggle.on .toggle-thumb { left: 20px; }

.avatar-img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.btn-outline {
  width: 100%;
  height: 40px;
  background: white;
  color: #1A233D;
  border: 1px solid #E5E7EB;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-outline:hover { background: #F3F4F6; }

/* 폼 */
.form-group {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-size: 13px;
  font-weight: 500;
  color: #6C757D;
}

.form-static {
  font-size: 14px;
  color: #1A233D;
  margin: 0;
}

.form-input {
  width: 100%;
  height: 40px;
  padding: 0 12px;
  border: 1px solid #E5E7EB;
  border-radius: 6px;
  font-size: 14px;
  color: #1A233D;
  outline: none;
}

.form-input:focus { border-color: #1A233D; }

.form-row {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.btn-row {
  display: flex;
  gap: 12px;
  width: 100%;
}

.btn-save {
  flex: 1;
  height: 44px;
  background: #1A233D;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}

.btn-save:disabled { opacity: 0.6; cursor: not-allowed; }

.btn-cancel {
  flex: 1;
  height: 44px;
  background: white;
  color: #6C757D;
  border: 1px solid #E5E7EB;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
}

.btn-logout {
  width: 100%;
  height: 44px;
  background: white;
  color: #EF4444;
  border: 1px solid #EF4444;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}

.btn-withdraw {
  background: none;
  border: none;
  color: #9CA3AF;
  font-size: 13px;
  cursor: pointer;
  text-decoration: underline;
}
</style>