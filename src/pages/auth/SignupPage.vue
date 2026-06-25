<template>
  <div class="signup-wrap">
    <div class="signup-box">
      <!-- 1단계: 회원 유형 선택 -->
      <div v-if="step === 1" class="step-wrap">
        <div class="signup-icon">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <rect x="6" y="4" width="12" height="12" rx="6" stroke="white" stroke-width="2.5" />
            <path
              d="M4 28c0-6.627 5.373-12 12-12s12 5.373 12 12"
              stroke="white"
              stroke-width="2.5"
              stroke-linecap="round"
            />
          </svg>
        </div>
        <h2 class="signup-title">회원 유형 선택</h2>
        <p class="signup-sub">가입할 유형을 선택해주세요</p>

        <div class="type-cards">
          <div
            :class="['type-card', selectedRole === 'USER' ? 'active' : '']"
            @click="selectedRole = 'USER'"
          >
            <div class="type-icon">👤</div>
            <p class="type-name">프리랜서</p>
            <p class="type-desc">
              프리랜서로 활동하고 계신 분, 전문 기술을 보유하고 프로젝트에 참여하고 싶은 분
            </p>
            <span class="type-link">프리랜서로 시작하기 →</span>
          </div>
          <div
            :class="['type-card', selectedRole === 'COMPANY' ? 'active' : '']"
            @click="selectedRole = 'COMPANY'"
          >
            <div class="type-icon">🏢</div>
            <p class="type-name">회사</p>
            <p class="type-desc">
              프리랜서를 찾고 계신 분, 전문 인력과 함께 프로젝트를 진행하고 싶은 분
            </p>
            <span class="type-link">회사로 시작하기 →</span>
          </div>
        </div>

        <button class="btn-primary" @click="goStep2" :disabled="!selectedRole">다음</button>
        <p class="footer-link">이미 계정이 있으신가요? <a href="/login">로그인</a></p>
      </div>

      <!-- 2단계: 가입 폼 -->
      <div v-if="step === 2" class="step-wrap">
        <div class="signup-icon">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <rect x="6" y="4" width="12" height="12" rx="6" stroke="white" stroke-width="2.5" />
            <path
              d="M4 28c0-6.627 5.373-12 12-12s12 5.373 12 12"
              stroke="white"
              stroke-width="2.5"
              stroke-linecap="round"
            />
          </svg>
        </div>
        <h2 class="signup-title">
          {{ selectedRole === 'USER' ? '프리랜서 회원가입' : '회사 회원가입' }}
        </h2>
        <p class="signup-sub">
          {{
            selectedRole === 'USER'
              ? '프리랜서로 가입하여 프로젝트를 시작하세요'
              : '회사로 가입하여 프리랜서를 찾으세요'
          }}
        </p>

        <!-- 이메일 + 인증번호 발송 -->
        <div class="form-group">
          <label class="form-label">이메일</label>
          <div class="input-row">
            <input
              v-model="form.email"
              type="email"
              class="form-input"
              placeholder="로그인 이메일을 입력하세요"
              :disabled="emailVerified"
            />
            <button class="btn-inline" @click="sendCode" :disabled="emailVerified || isSendingCode">
              {{ isSendingCode ? '발송 중...' : codeSent ? '재발송' : '인증번호 발송' }}
            </button>
          </div>
        </div>

        <!-- 인증번호 확인 -->
        <div class="form-group" v-if="codeSent">
          <label class="form-label">이메일 인증 확인</label>
          <div class="input-row">
            <input
              v-model="verifyCode"
              type="text"
              class="form-input"
              placeholder="인증 번호를 입력하세요"
              :disabled="emailVerified"
            />
            <button class="btn-inline" @click="checkCode" :disabled="emailVerified || isVerifying">
              {{ isVerifying ? '확인 중...' : emailVerified ? '인증완료' : '인증번호 확인' }}
            </button>
          </div>
          <p v-if="emailVerified" class="success-msg">✓ 이메일 인증이 완료되었습니다</p>
        </div>

        <!-- 회사명 (회사만) -->
        <div class="form-group" v-if="selectedRole === 'COMPANY'">
          <label class="form-label">회사명</label>
          <input
            v-model="form.companyName"
            type="text"
            class="form-input"
            placeholder="회사명을 입력하세요"
          />
        </div>

        <!-- 이름 -->
        <div class="form-group">
          <label class="form-label">{{
            selectedRole === 'COMPANY' ? '담당자 이름' : '이름'
          }}</label>
          <input
            v-model="form.name"
            type="text"
            class="form-input"
            placeholder="이름을 입력하세요"
          />
        </div>

        <!-- 비밀번호 -->
        <div class="form-group">
          <label class="form-label">비밀번호</label>
          <input
            v-model="form.password"
            type="password"
            class="form-input"
            placeholder="비밀번호를 입력하세요"
          />
        </div>

        <!-- 비밀번호 확인 -->
        <div class="form-group">
          <label class="form-label">비밀번호 확인</label>
          <input
            v-model="passwordConfirm"
            type="password"
            class="form-input"
            placeholder="비밀번호를 다시 입력하세요"
          />
          <p v-if="passwordConfirm && form.password !== passwordConfirm" class="error-msg">
            비밀번호가 일치하지 않습니다
          </p>
        </div>

        <!-- 연락처 -->
        <div class="form-group">
          <label class="form-label">연락처</label>
          <PhoneNumberInput v-model="form.phone" />
        </div>

        <!-- 직군/직종 -->
        <div class="form-group">
          <label class="form-label">{{ selectedRole === 'COMPANY' ? '직종' : '직군' }}</label>
          <select v-model="form.jobCategory" class="form-input">
            <option value="">
              {{ selectedRole === 'COMPANY' ? '직종을 선택하세요' : '직군 선택' }}
            </option>
            <option v-for="opt in JOB_CATEGORY_OPTIONS" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </div>

        <!-- 알림 수신 -->
        <div class="form-check">
          <input v-model="form.pushable" type="checkbox" id="pushable" />
          <label for="pushable">알림 수신 동의 (선택)</label>
        </div>

        <!-- 사업자번호 인증 (회사만) -->
        <div v-if="selectedRole === 'COMPANY'" class="form-group">
          <div class="business-verify-row">
            <div class="business-status">
              <span class="form-label">사업자번호 (선택)</span>
              <span v-if="businessVerified" class="verified-badge"
                >✓ {{ formatBusinessNumber(form.businessNumber) }} 인증완료</span
              >
              <span v-else class="unverified-text">아직 인증되지 않았습니다</span>
            </div>
            <button class="btn-inline" @click="showBusinessModal = true">
              {{ businessVerified ? '재인증' : '인증하기' }}
            </button>
          </div>
        </div>

        <p v-if="errorMsg" class="error-msg">{{ errorMsg }}</p>

        <button class="btn-primary" @click="handleSignup" :disabled="isLoading">
          {{ isLoading ? '가입 중...' : '가입하기' }}
        </button>
        <p class="footer-link">이미 계정이 있으신가요? <a href="/login">로그인</a></p>
      </div>
    </div>

    <!-- 사업자번호 인증 모달 -->
    <BusinessVerifyModal
      v-if="showBusinessModal"
      :initial-value="form.businessNumber"
      @close="showBusinessModal = false"
      @verified="handleBusinessVerified"
    />
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { signup, sendVerificationCode, verifyEmailCode } from '@/features/auth/api/authApi.js'
import BusinessVerifyModal from '@/features/auth/ui/BusinessVerifyModal.vue'
import PhoneNumberInput from '@/shared/components/form/PhoneNumberInput.vue'
import { JOB_CATEGORY_OPTIONS } from '@/shared/constants/jobCategory.js'
import { formatBusinessNumber } from '@/shared/utils/businessNumber.js'

const router = useRouter()

const step = ref(1)
const selectedRole = ref('') // 'USER' | 'COMPANY'
const isLoading = ref(false)
const errorMsg = ref('')

const codeSent = ref(false)
const emailVerified = ref(false)
const isSendingCode = ref(false)
const isVerifying = ref(false)
const verifyCode = ref('')

const businessVerified = ref(false)
const showBusinessModal = ref(false)

const passwordConfirm = ref('')

const form = reactive({
  email: '',
  password: '',
  name: '',
  companyName: '',
  phone: '',
  jobCategory: '',
  pushable: false,
  businessNumber: '',
  role: '',
})

function handleBusinessVerified({ businessNumber, verified }) {
  form.businessNumber = businessNumber
  businessVerified.value = verified
  // 성공했을 때만 모달을 닫음. 실패 시 에러 메시지를 사용자가 확인할 수 있도록 열어둠
  if (verified) {
    showBusinessModal.value = false
  }
}

function goStep2() {
  if (!selectedRole.value) return
  form.role = selectedRole.value
  step.value = 2
}

async function sendCode() {
  if (!form.email) {
    errorMsg.value = '이메일을 입력하세요.'
    return
  }
  errorMsg.value = ''
  isSendingCode.value = true
  try {
    await sendVerificationCode(form.email, 'signup')
    codeSent.value = true
  } catch (err) {
    errorMsg.value = err.response?.data?.message || '인증번호 발송에 실패했습니다.'
  } finally {
    isSendingCode.value = false
  }
}

async function checkCode() {
  if (!verifyCode.value) {
    errorMsg.value = '인증번호를 입력하세요.'
    return
  }
  errorMsg.value = ''
  isVerifying.value = true
  try {
    const res = await verifyEmailCode(form.email, verifyCode.value, 'signup')
    if (res.data.data === true) {
      emailVerified.value = true
    } else {
      errorMsg.value = '인증번호가 일치하지 않습니다.'
    }
  } catch (err) {
    errorMsg.value = err.response?.data?.message || '인증번호 확인에 실패했습니다.'
  } finally {
    isVerifying.value = false
  }
}

async function handleSignup() {
  errorMsg.value = ''

  if (!emailVerified.value) {
    errorMsg.value = '이메일 인증을 완료하세요.'
    return
  }
  if (!form.name || !form.password || !form.phone || !form.jobCategory) {
    errorMsg.value = '모든 필수 항목을 입력하세요.'
    return
  }
  if (selectedRole.value === 'COMPANY' && !form.companyName) {
    errorMsg.value = '회사명을 입력하세요.'
    return
  }
  if (form.password !== passwordConfirm.value) {
    errorMsg.value = '비밀번호가 일치하지 않습니다.'
    return
  }

  isLoading.value = true
  try {
    await signup({ ...form })
    alert('회원가입이 완료되었습니다. 로그인해주세요.')
    router.push('/login')
  } catch (err) {
    errorMsg.value = err.response?.data?.message || '회원가입에 실패했습니다.'
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.signup-wrap {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f4f5f7;
  padding: 40px 16px;
}

.signup-box {
  background: #ffffff;
  border-radius: 12px;
  padding: 32px 24px;
  width: 100%;
  max-width: 512px;
  box-shadow:
    0 10px 15px -3px rgba(0, 0, 0, 0.1),
    0 4px 6px -4px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(26, 35, 61, 0.1);
}

.step-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.signup-icon {
  width: 64px;
  height: 64px;
  background: #1a233d;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 4px;
}

.signup-title {
  font-size: 24px;
  font-weight: 500;
  color: #1a233d;
  margin: 0;
}

.signup-sub {
  font-size: 16px;
  color: #6c757d;
  margin: 0;
}

.type-cards {
  display: flex;
  gap: 12px;
  width: 100%;
}

.type-card {
  flex: 1;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  padding: 20px 16px;
  cursor: pointer;
  transition: all 0.15s;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.type-card.active {
  border-color: #1a233d;
  background: #e8edf5;
}

.type-icon {
  font-size: 28px;
}
.type-name {
  font-size: 15px;
  font-weight: 600;
  color: #1a233d;
  margin: 0;
}
.type-desc {
  font-size: 12px;
  color: #6c757d;
  margin: 0;
  line-height: 1.5;
}
.type-link {
  font-size: 13px;
  color: #1a233d;
  font-weight: 500;
}

.form-group {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-size: 14px;
  font-weight: 500;
  color: #1a233d;
  line-height: 14px;
}

.form-input {
  width: 100%;
  height: 36px;
  padding: 4px 12px;
  border: 1px solid rgba(26, 35, 61, 0.1);
  border-radius: 6px;
  font-size: 14px;
  color: #1a233d;
  outline: none;
  transition: border-color 0.15s;
  background: white;
}

.form-input:focus {
  border-color: #1a233d;
}
.form-input:disabled {
  background: #f3f4f6;
  cursor: not-allowed;
}

select.form-input {
  cursor: pointer;
}

.input-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.input-row .form-input {
  flex: 1;
}

.business-verify-row {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  background: #f9fafb;
  border-radius: 8px;
}

.business-status {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.verified-badge {
  font-size: 12.5px;
  color: #22c55e;
  font-weight: 600;
}

.unverified-text {
  font-size: 12.5px;
  color: #9ca3af;
}

.business-verify-row .btn-inline {
  width: auto;
  min-width: 80px;
  height: 36px;
  flex-shrink: 0;
}

.btn-inline {
  flex-shrink: 0;
  min-width: 100px;
  height: 40px;
  padding: 0 10px;
  background: #1a233d;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.15s;
}

.btn-inline:hover:not(:disabled) {
  background: #253a63;
}
.btn-inline:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.form-check {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.form-check input {
  width: 16px;
  height: 16px;
  cursor: pointer;
}
.form-check label {
  font-size: 14px;
  font-weight: 500;
  color: #1a233d;
  cursor: pointer;
}

.btn-primary {
  width: 100%;
  height: 40px;
  background: #1a233d;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s;
}

.btn-primary:hover:not(:disabled) {
  background: #253a63;
}
.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.footer-link {
  font-size: 14px;
  color: #6c757d;
}
.footer-link a {
  color: #1a233d;
  text-decoration: none;
  font-weight: 500;
}
.error-msg {
  font-size: 13px;
  color: #ef4444;
  margin: 0;
}
.success-msg {
  font-size: 13px;
  color: #22c55e;
  margin: 0;
}
</style>
