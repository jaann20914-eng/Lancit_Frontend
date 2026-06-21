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

      <div class="form-group">
        <label class="form-label">비밀번호 재설정</label>
        <input
          v-model="newPassword"
          type="password"
          class="form-input"
          placeholder="비밀번호를 입력하세요"
        />
      </div>

      <div class="form-group">
        <label class="form-label">비밀번호 확인</label>
        <input
          v-model="newPasswordConfirm"
          type="password"
          class="form-input"
          placeholder="비밀번호를 다시 입력하세요"
        />
        <p v-if="newPasswordConfirm && newPassword !== newPasswordConfirm" class="error-msg">
          비밀번호가 일치하지 않습니다
        </p>
      </div>

      <p v-if="errorMsg" class="error-msg">{{ errorMsg }}</p>
      <p v-if="successMsg" class="success-msg">{{ successMsg }}</p>

      <button class="btn-primary" @click="handleReset" :disabled="isLoading">
        {{ isLoading ? '재설정 중...' : '비밀번호 재설정' }}
      </button>

      <p class="footer-link">로그인 페이지로 돌아가기 <a href="/login">로그인</a></p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { resetPassword } from '@/features/auth/api/authApi.js'

const router = useRouter()
const route = useRoute()

const email = route.query.email || ''
const role = route.query.role || 'USER'
const newPassword = ref('')
const newPasswordConfirm = ref('')
const isLoading = ref(false)
const errorMsg = ref('')
const successMsg = ref('')

async function handleReset() {
  errorMsg.value = ''
  successMsg.value = ''

  if (!newPassword.value) {
    errorMsg.value = '새 비밀번호를 입력하세요.'
    return
  }
  if (newPassword.value !== newPasswordConfirm.value) {
    errorMsg.value = '비밀번호가 일치하지 않습니다.'
    return
  }

  isLoading.value = true

  try {
    await resetPassword(email, newPassword.value, role)
    successMsg.value = '비밀번호가 재설정되었습니다.'
    setTimeout(() => router.push('/login'), 1500)
  } catch (err) {
    errorMsg.value = err.response?.data?.message || '비밀번호 재설정에 실패했습니다.'
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
.success-msg {
  font-size: 13px;
  color: #22c55e;
  margin: 0;
  width: 100%;
}
</style>
