

<template>
  <div class="signup-wrap">
    <div class="signup-box">

      <!-- 1단계: 회원 유형 선택 -->
      <div v-if="step === 1" class="step-wrap">
        <div class="signup-icon">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <rect x="6" y="4" width="12" height="12" rx="6" stroke="white" stroke-width="2.5"/>
            <path d="M4 28c0-6.627 5.373-12 12-12s12 5.373 12 12" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
          </svg>
        </div>
        <h2 class="signup-title">회원 유형 선택</h2>
        <p class="signup-sub">가입할 유형을 선택해주세요</p>

        <div class="type-cards">
          <div :class="['type-card', selectedRole === 'user' ? 'active' : '']" @click="selectedRole = 'user'">
            <div class="type-icon">👤</div>
            <p class="type-name">프리랜서</p>
            <p class="type-desc">프리랜서로 활동하고 계신 분, 전문 기술을 보유하고 프로젝트에 참여하고 싶은 분, 안전하게 계약을 체결하고 싶은 분</p>
            <span class="type-link">프리랜서로 시작하기 →</span>
          </div>
          <div :class="['type-card', selectedRole === 'company' ? 'active' : '']" @click="selectedRole = 'company'">
            <div class="type-icon">🏢</div>
            <p class="type-name">회사</p>
            <p class="type-desc">프리랜서를 찾고 계신 분, 전문 인력과 함께 프로젝트를 진행하고 싶은 분, 안전하게 계약을 체결하고 싶은 분</p>
            <span class="type-link">회사로 시작하기 →</span>
          </div>
        </div>

        <button class="btn-primary" @click="goStep2" :disabled="!selectedRole">다음</button>
        <p class="footer-link">이미 계정이 있으신가요? <a href="/login">로그인</a></p>
      </div>

      <!-- 2단계: 프리랜서 가입 폼 -->
      <div v-if="step === 2 && selectedRole === 'user'" class="step-wrap">
        <div class="signup-icon">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <rect x="6" y="4" width="12" height="12" rx="6" stroke="white" stroke-width="2.5"/>
            <path d="M4 28c0-6.627 5.373-12 12-12s12 5.373 12 12" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
          </svg>
        </div>
        <h2 class="signup-title">프리랜서 회원가입</h2>
        <p class="signup-sub">프리랜서로 가입하여 프로젝트를 시작하세요</p>

        <!-- 이메일 + 인증번호 발송 -->
        <div class="form-group">
          <label class="form-label">이메일</label>
          <div class="input-row">
            <input v-model="form.email" type="email" class="form-input" placeholder="로그인 이메일을 입력하세요" :disabled="emailVerified"/>
            <button class="btn-inline" @click="sendCode" :disabled="emailVerified || codeSent">
              {{ codeSent ? '발송됨' : '인증번호 발송' }}
            </button>
          </div>
        </div>

        <!-- 인증번호 확인 -->
        <div class="form-group">
          <label class="form-label">이메일 인증 확인</label>
          <div class="input-row">
            <input v-model="form.verifyCode" type="text" class="form-input" placeholder="인증 번호를 입력하세요" :disabled="emailVerified"/>
            <button class="btn-inline" @click="verifyCode" :disabled="emailVerified">
              {{ emailVerified ? '인증완료' : '인증번호 확인' }}
            </button>
          </div>
          <p v-if="emailVerified" class="success-msg">✓ 이메일 인증이 완료되었습니다</p>
        </div>

        <!-- 이름 -->
        <div class="form-group">
          <label class="form-label">이름</label>
          <input v-model="form.name" type="text" class="form-input" placeholder="성함을 입력하세요"/>
        </div>

        <!-- 비밀번호 -->
        <div class="form-group">
          <label class="form-label">비밀번호</label>
          <input v-model="form.password" type="password" class="form-input" placeholder="비밀번호를 입력하세요"/>
        </div>

        <!-- 비밀번호 확인 -->
        <div class="form-group">
          <label class="form-label">비밀번호 확인</label>
          <input v-model="form.passwordConfirm" type="password" class="form-input" placeholder="비밀번호를 다시 입력하세요"/>
          <p v-if="form.passwordConfirm && form.password !== form.passwordConfirm" class="error-msg">비밀번호가 일치하지 않습니다</p>
        </div>

        <!-- 연락처 -->
        <div class="form-group">
          <label class="form-label">연락처</label>
          <input v-model="form.phone" type="tel" class="form-input" placeholder="연락처를 입력하세요"/>
        </div>

        <!-- 직군 -->
        <div class="form-group">
          <label class="form-label">직군</label>
          <select v-model="form.jobCategory" class="form-input">
            <option value="">직군 선택</option>
            <option v-for="opt in JOB_CATEGORY_OPTIONS" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </div>

        <!-- 알림 수신 -->
        <div class="form-check">
          <input v-model="form.pushable" type="checkbox" id="pushable-user"/>
          <label for="pushable-user">알림 수신 동의 (선택)</label>
        </div>

        <p v-if="errorMsg" class="error-msg">{{ errorMsg }}</p>

        <button class="btn-primary" @click="handleSignup" :disabled="isLoading">
          {{ isLoading ? '가입 중...' : '가입하기' }}
        </button>
        <p class="footer-link">
          이미 계정이 있으신가요? <a href="/login">로그인</a>
        </p>
      </div>

      <!-- 2단계: 회사 가입 폼 -->
      <div v-if="step === 2 && selectedRole === 'company'" class="step-wrap">
        <div class="signup-icon">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <rect x="4" y="8" width="24" height="20" rx="2" stroke="white" stroke-width="2.5"/>
            <path d="M10 8V6a6 6 0 0112 0v2" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
          </svg>
        </div>
        <h2 class="signup-title">회사 회원가입</h2>
        <p class="signup-sub">회사로 가입하여 프리랜서를 찾으세요</p>

        <!-- 이메일 + 인증번호 발송 -->
        <div class="form-group">
          <label class="form-label">이메일</label>
          <div class="input-row">
            <input v-model="form.email" type="email" class="form-input" placeholder="로그인 이메일을 입력하세요" :disabled="emailVerified"/>
            <button class="btn-inline" @click="sendCode" :disabled="emailVerified || codeSent">
              {{ codeSent ? '발송됨' : '인증번호 발송' }}
            </button>
          </div>
        </div>

        <!-- 인증번호 확인 -->
        <div class="form-group">
          <label class="form-label">이메일 인증 확인</label>
          <div class="input-row">
            <input v-model="form.verifyCode" type="text" class="form-input" placeholder="인증 번호를 입력하세요" :disabled="emailVerified"/>
            <button class="btn-inline" @click="verifyCode" :disabled="emailVerified">
              {{ emailVerified ? '인증완료' : '인증번호 확인' }}
            </button>
          </div>
          <p v-if="emailVerified" class="success-msg">✓ 이메일 인증이 완료되었습니다</p>
        </div>

        <!-- 회사명 -->
        <div class="form-group">
          <label class="form-label">회사명</label>
          <input v-model="form.companyName" type="text" class="form-input" placeholder="회사명을 입력하세요"/>
        </div>

        <!-- 담당자 이름 -->
        <div class="form-group">
          <label class="form-label">이름</label>
          <input v-model="form.name" type="text" class="form-input" placeholder="담당자명을 입력하세요"/>
        </div>

        <!-- 비밀번호 -->
        <div class="form-group">
          <label class="form-label">비밀번호</label>
          <input v-model="form.password" type="password" class="form-input" placeholder="비밀번호를 입력하세요"/>
        </div>

        <!-- 비밀번호 확인 -->
        <div class="form-group">
          <label class="form-label">비밀번호 확인</label>
          <input v-model="form.passwordConfirm" type="password" class="form-input" placeholder="비밀번호를 다시 입력하세요"/>
          <p v-if="form.passwordConfirm && form.password !== form.passwordConfirm" class="error-msg">비밀번호가 일치하지 않습니다</p>
        </div>

        <!-- 연락처 -->
        <div class="form-group">
          <label class="form-label">연락처</label>
          <input v-model="form.phone" type="tel" class="form-input" placeholder="연락처를 입력하세요"/>
        </div>

        <!-- 업종 -->
        <div class="form-group">
          <label class="form-label">업종</label>
          <select v-model="form.jobCategory" class="form-input">
            <option value="">직군 선택</option>
            <option v-for="opt in JOB_CATEGORY_OPTIONS" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </div>

        <!-- 알림 수신 -->
        <div class="form-check">
          <input v-model="form.pushable" type="checkbox" id="pushable-company"/>
          <label for="pushable-company">알림 수신 동의 (선택)</label>
        </div>

        <!-- 사업자번호 인증 -->
        <button class="btn-outline" @click="verifyBusiness">
          사업자 번호 인증하기
        </button>

        <p v-if="errorMsg" class="error-msg">{{ errorMsg }}</p>

        <button class="btn-primary" @click="handleSignup" :disabled="isLoading">
          {{ isLoading ? '가입 중...' : '가입하기' }}
        </button>
        <p class="footer-link">
          이미 계정이 있으신가요? <a href="/login">로그인</a>
        </p>
      </div>

    </div>
  </div>
</template>

<script setup>
import { JOB_CATEGORY_OPTIONS } from '@/shared/constants/jobCategory.js'
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { signupUser, signupCompany } from '@/features/auth/api/authApi.js'

const router = useRouter()

const step = ref(1)
const selectedRole = ref('')
const isLoading = ref(false)
const errorMsg = ref('')
const codeSent = ref(false)
const emailVerified = ref(false)

const form = reactive({
  email: '',
  verifyCode: '',
  name: '',
  password: '',
  passwordConfirm: '',
  phone: '',
  jobCategory: '',
  pushable: false,
  companyName: '',
  businessNumber: ''
})

function goStep2() {
  if (!selectedRole.value) return
  step.value = 2
}

// 인증번호 발송 (TODO: API 연동)
function sendCode() {
  if (!form.email) {
    errorMsg.value = '이메일을 입력하세요.'
    return
  }
  codeSent.value = true
  errorMsg.value = ''
  alert('인증번호가 발송되었습니다.')
}

// 인증번호 확인 (TODO: API 연동)
function verifyCode() {
  if (!form.verifyCode) {
    errorMsg.value = '인증번호를 입력하세요.'
    return
  }
  emailVerified.value = true
  errorMsg.value = ''
}

// 사업자번호 인증 (TODO: API 연동)
function verifyBusiness() {
  alert('사업자번호 인증 기능은 추후 연동됩니다.')
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
  if (form.password !== form.passwordConfirm) {
    errorMsg.value = '비밀번호가 일치하지 않습니다.'
    return
  }

  isLoading.value = true

  try {
    if (selectedRole.value === 'user') {
      await signupUser({
        email: form.email,
        password: form.password,
        name: form.name,
        phone: form.phone,
        jobCategory: form.jobCategory,
        pushable: form.pushable
      })
    } else {
      await signupCompany({
        email: form.email,
        password: form.password,
        name: form.name,
        companyName: form.companyName,
        phone: form.phone,
        jobCategory: form.jobCategory,
        pushable: form.pushable,
        businessNumber: form.businessNumber || null
      })
    }
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
  box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1);
  border: 1px solid rgba(26,35,61,0.10);
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
  background: #1A233D;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 4px;
}

.signup-title {
  font-size: 24px;
  font-weight: 500;
  color: #1A233D;
  margin: 0;
}

.signup-sub {
  font-size: 16px;
  color: #6C757D;
  margin: 0;
}

/* 유형 선택 카드 */
.type-cards {
  display: flex;
  gap: 12px;
  width: 100%;
}

.type-card {
  flex: 1;
  border: 2px solid #E5E7EB;
  border-radius: 10px;
  padding: 20px 16px;
  cursor: pointer;
  transition: all 0.15s;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.type-card.active {
  border-color: #1A233D;
  background: #E8EDF5;
}

.type-icon { font-size: 28px; }
.type-name { font-size: 15px; font-weight: 600; color: #1A233D; margin: 0; }
.type-desc { font-size: 12px; color: #6C757D; margin: 0; line-height: 1.5; }
.type-link { font-size: 13px; color: #1A233D; font-weight: 500; }

/* 폼 */
.form-group {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-size: 14px;
  font-weight: 500;
  color: #1A233D;
  line-height: 14px;
}

.form-input {
  width: 100%;
  height: 36px;
  padding: 4px 12px;
  border: 1px solid rgba(26,35,61,0.10);
  border-radius: 6px;
  font-size: 14px;
  color: #1A233D;
  outline: none;
  transition: border-color 0.15s;
  background: white;
}

.form-input:focus { border-color: #1A233D; }
.form-input:disabled { background: #F3F4F6; cursor: not-allowed; }

select.form-input { cursor: pointer; }

/* 인풋 + 버튼 나란히 */
.input-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.input-row .form-input { flex: 1; }

.btn-inline {
  flex-shrink: 0;
  width: 100px;
  height: 40px;
  background: #1A233D;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.15s;
}

.btn-inline:hover:not(:disabled) { background: #253A63; }
.btn-inline:disabled { opacity: 0.6; cursor: not-allowed; }

/* 체크박스 */
.form-check {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.form-check input { width: 16px; height: 16px; cursor: pointer; }
.form-check label { font-size: 14px; font-weight: 500; color: #1A233D; cursor: pointer; }

/* 버튼 */
.btn-primary {
  width: 100%;
  height: 40px;
  background: #1A233D;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s;
}

.btn-primary:hover:not(:disabled) { background: #253A63; }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

.btn-outline {
  width: 100%;
  height: 40px;
  background: white;
  color: #1A233D;
  border: 1px solid #1A233D;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-outline:hover { background: #E8EDF5; }

/* 텍스트 */
.footer-link { font-size: 14px; color: #6C757D; }
.footer-link a { color: #1A233D; text-decoration: none; font-weight: 500; }
.error-msg { font-size: 13px; color: #EF4444; margin: 0; }
.success-msg { font-size: 13px; color: #22C55E; margin: 0; }
</style>