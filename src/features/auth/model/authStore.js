import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('accessToken') || null)
  const email = ref(localStorage.getItem('email') || null)
  const role = ref(localStorage.getItem('role') || null)
  const chatRoomIds = ref(JSON.parse(localStorage.getItem('chatRoomIds') || '[]'))
  const profileImageUrl = ref(localStorage.getItem('profileImageUrl') || null)

  const isLoggedIn = computed(() => !!token.value)
  const isFreelancer = computed(() => role.value === 'USER')
  const isCompany = computed(() => role.value === 'COMPANY')

  function login(data) {
    token.value = data.accessToken
    email.value = data.email
    role.value = data.role
    chatRoomIds.value = data.chatRoomIds || []
    profileImageUrl.value = data.profileImageUrl || null

    localStorage.setItem('accessToken', data.accessToken)
    localStorage.setItem('email', data.email)
    localStorage.setItem('role', data.role)
    localStorage.setItem('chatRoomIds', JSON.stringify(data.chatRoomIds || []))
    if (data.profileImageUrl) {
      localStorage.setItem('profileImageUrl', data.profileImageUrl)
    } else {
      localStorage.removeItem('profileImageUrl')
    }
  }

  // 마이페이지에서 프로필 이미지를 변경했을 때, 로그아웃 없이 사이드바 등에
  // 바로 반영되도록 별도로 갱신할 수 있는 함수
  function updateProfileImage(url) {
    profileImageUrl.value = url
    if (url) {
      localStorage.setItem('profileImageUrl', url)
    } else {
      localStorage.removeItem('profileImageUrl')
    }
  }

  function logout() {
    token.value = null
    email.value = null
    role.value = null
    chatRoomIds.value = []
    profileImageUrl.value = null
    localStorage.removeItem('accessToken')
    localStorage.removeItem('email')
    localStorage.removeItem('role')
    localStorage.removeItem('chatRoomIds')
    localStorage.removeItem('profileImageUrl')
  }

  return {
    token,
    email,
    role,
    chatRoomIds,
    profileImageUrl,
    isLoggedIn,
    isFreelancer,
    isCompany,
    login,
    logout,
    updateProfileImage,
  }
})
