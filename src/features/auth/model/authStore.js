import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

function normalizeRole(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : null
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('accessToken') || null)
  const email = ref(localStorage.getItem('email') || null)
  const role = ref(normalizeRole(localStorage.getItem('role')))  // 'user' | 'company'

  const isLoggedIn = computed(() => !!token.value)
  const isFreelancer = computed(() => role.value === 'user')
  const isCompany = computed(() => role.value === 'company')

  function login(data) {
    token.value = data.accessToken
    email.value = data.email
    role.value = normalizeRole(data.role)
    localStorage.setItem('accessToken', data.accessToken)
    localStorage.setItem('email', data.email)
    localStorage.setItem('role', role.value)
  }

  function logout() {
    token.value = null
    email.value = null
    role.value = null
    localStorage.removeItem('accessToken')
    localStorage.removeItem('email')
    localStorage.removeItem('role')
  }

  return { token, email, role, isLoggedIn, isFreelancer, isCompany, login, logout }
})
