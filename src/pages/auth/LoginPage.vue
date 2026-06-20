<template>
  <div class="login-wrap">
    <div class="login-box">

      <div class="login-icon">→</div>
      <h2 class="login-title">로그인</h2>
      <p class="login-sub">계정에 로그인하세요</p>

      <!-- 역할 탭 -->
      <div class="role-tabs">
        <button
          :class="['role-tab', selectedRole === 'user' ? 'active' : '']"
          @click="selectedRole = 'user'"
        >
          프리랜서
        </button>
        <button
          :class="['role-tab', selectedRole === 'company' ? 'active' : '']"
          @click="selectedRole = 'company'"
        >
          회사
        </button>
      </div>

      <!-- 폼 -->
      <div class="form-group">
        <label class="form-label">이메일</label>
        <input
          v-model="email"
          type="email"
          class="form-input"
          placeholder="이메일을 입력하세요"
        />
      </div>

      <div class="form-group">
        <label class="form-label">비밀번호</label>
        <input
          v-model="password"
          type="password"
          class="form-input"
          placeholder="비밀번호를 입력하세요"
        />
      </div>

      <p v-if="errorMsg" class="error-msg">{{ errorMsg }}</p>

      <button class="btn-login" @click="handleLogin" :disabled="isLoading">
        {{ isLoading ? '로그인 중...' : '로그인' }}
      </button>

      <p class="login-footer">
        계정이 없으신가요? <a href="/signup">회원가입</a>
        · <a href="/password-reset">비밀번호 찾기</a>
      </p>

    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { login } from '@/features/auth/api/authApi.js'
import { useAuthStore } from '@/features/auth/model/authStore.js'

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const selectedRole = ref('user')
const isLoading = ref(false)
const errorMsg = ref('')

async function handleLogin() {
  if (!email.value || !password.value) {
    errorMsg.value = '이메일과 비밀번호를 입력하세요.'
    return
  }

  isLoading.value = true
  errorMsg.value = ''

  try {
    const res = await login(email.value, password.value, selectedRole.value)
    const data = res.data.data

    authStore.login({
      accessToken: data.accessToken,
      email: data.email,
      role: data.role
    })

    // 역할에 따라 대시보드로 이동
    if (authStore.role === 'user') {
      router.push('/freelancer/dashboard')
    } else {
      router.push('/company/dashboard')
    }

  } catch {
    errorMsg.value = '이메일 또는 비밀번호가 올바르지 않습니다.'
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.login-wrap {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f4f5f7;
}

.login-box {
  background: #ffffff;
  border-radius: 12px;
  padding: 40px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.login-icon {
  width: 56px;
  height: 56px;
  background: #1B2B4B;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 20px;
  margin-bottom: 16px;
}

.login-title {
  font-size: 20px;
  font-weight: 700;
  color: #111827;
  margin-bottom: 4px;
}

.login-sub {
  font-size: 13px;
  color: #9CA3AF;
  margin-bottom: 24px;
}

.role-tabs {
  display: flex;
  width: 100%;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 20px;
}

.role-tab {
  flex: 1;
  padding: 10px;
  font-size: 14px;
  font-weight: 500;
  background: #fff;
  color: #6B7280;
  border: none;
  cursor: pointer;
  transition: all 0.15s;
}

.role-tab.active {
  background: #1B2B4B;
  color: #fff;
}

.form-group {
  width: 100%;
  margin-bottom: 16px;
}

.form-label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: #4B5563;
  margin-bottom: 6px;
}

.form-input {
  width: 100%;
  height: 40px;
  padding: 0 12px;
  border: 1px solid #E5E7EB;
  border-radius: 6px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.15s;
}

.form-input:focus {
  border-color: #1B2B4B;
}

.error-msg {
  width: 100%;
  font-size: 13px;
  color: #EF4444;
  margin-bottom: 12px;
}

.btn-login {
  width: 100%;
  height: 44px;
  background: #1B2B4B;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  margin-bottom: 16px;
  transition: background 0.15s;
}

.btn-login:hover:not(:disabled) {
  background: #253A63;
}

.btn-login:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.login-footer {
  font-size: 13px;
  color: #6B7280;
}

.login-footer a {
  color: #1B2B4B;
  text-decoration: none;
  font-weight: 500;
}
</style>
