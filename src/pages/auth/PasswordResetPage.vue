<template>
  <div class="reset-wrap">
    <div class="reset-box">
      <div class="reset-icon">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <path
            d="M20 14V10a6 6 0 10-12 0v4"
            stroke="white"
            stroke-width="2.5"
            stroke-linecap="round"
          />
          <rect x="4" y="14" width="20" height="14" rx="3" stroke="white" stroke-width="2.5" />
          <circle cx="14" cy="21" r="2" fill="white" />
        </svg>
      </div>

      <h2 class="reset-title">비밀번호 찾기</h2>
      <p class="reset-sub">이메일로 인증코드를 받으세요</p>

      <!-- 역할 선택 (USER/COMPANY 어느 테이블인지 백엔드가 알아야 함) -->
      <div class="role-tabs">
        <button :class="['role-tab', role === 'USER' ? 'active' : '']" @click="role = 'USER'">
          프리랜서
        </button>
        <button :class="['role-tab', role === 'COMPANY' ? 'active' : '']" @click="role = 'COMPANY'">
          회사
        </button>
      </div>

      <div class="form-group">
        <label class="form-label">이메일</label>
        <input
          v-model="email"
          type="email"
          class="form-input"
          placeholder="이메일을 입력하세요"
          :disabled="codeSent"
        />
      </div>

      <div class="form-group" v-if="codeSent">
        <label class="form-label">인증번호</label>
        <input v-model="code" type="text" class="form-input" placeholder="인증 번호를 입력하세요" />
      </div>

      <p v-if="errorMsg" class="error-msg">{{ errorMsg }}</p>

      <button v-if="!codeSent" class="btn-primary" @click="handleSend" :disabled="isLoading">
        {{ isLoading ? '발송 중...' : '인증코드 발송' }}
      </button>

      <button v-else class="btn-primary" @click="handleVerify" :disabled="isLoading">
        {{ isLoading ? '확인 중...' : '인증번호 확인' }}
      </button>

      <p class="footer-link">로그인 페이지로 돌아가기 <a href="/login">로그인</a></p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { sendVerificationCode, verifyEmailCode } from '@/features/auth/api/authApi.js'

const router = useRouter()
const email = ref('')
const role = ref('USER')
const code = ref('')
const codeSent = ref(false)
const isLoading = ref(false)
const errorMsg = ref('')

async function handleSend() {
  if (!email.value) {
    errorMsg.value = '이메일을 입력하세요.'
    return
  }
  errorMsg.value = ''
  isLoading.value = true

  try {
    await sendVerificationCode(email.value, 'pwreset')
    codeSent.value = true
  } catch (err) {
    errorMsg.value = err.response?.data?.message || '인증코드 발송에 실패했습니다.'
  } finally {
    isLoading.value = false
  }
}

async function handleVerify() {
  if (!code.value) {
    errorMsg.value = '인증번호를 입력하세요.'
    return
  }
  errorMsg.value = ''
  isLoading.value = true

  try {
    const res = await verifyEmailCode(email.value, code.value, 'pwreset')
    if (res.data.data === true) {
      router.push({ name: 'PasswordNew', query: { email: email.value, role: role.value } })
    } else {
      errorMsg.value = '인증번호가 일치하지 않습니다.'
    }
  } catch (err) {
    errorMsg.value = err.response?.data?.message || '인증번호 확인에 실패했습니다.'
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.reset-wrap {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f4f5f7;
  padding: 40px 16px;
}

.reset-box {
  background: #ffffff;
  border-radius: 12px;
  padding: 32px 24px;
  width: 100%;
  max-width: 400px;
  box-shadow:
    0 10px 15px -3px rgba(0, 0, 0, 0.1),
    0 4px 6px -4px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(26, 35, 61, 0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.reset-icon {
  width: 64px;
  height: 64px;
  background: #1a233d;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.reset-title {
  font-size: 24px;
  font-weight: 500;
  color: #1a233d;
  margin: 0;
}

.reset-sub {
  font-size: 14px;
  color: #6c757d;
  margin: 0;
}

.role-tabs {
  display: flex;
  width: 100%;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
}

.role-tab {
  flex: 1;
  padding: 8px;
  font-size: 13px;
  font-weight: 500;
  background: #fff;
  color: #6b7280;
  border: none;
  cursor: pointer;
}

.role-tab.active {
  background: #1a233d;
  color: #fff;
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
  background: white;
  transition: border-color 0.15s;
}

.form-input:focus {
  border-color: #1a233d;
}
.form-input:disabled {
  background: #f3f4f6;
  cursor: not-allowed;
}

.btn-primary {
  width: 100%;
  height: 44px;
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
  width: 100%;
}
</style>
