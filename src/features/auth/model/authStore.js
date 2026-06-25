import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('accessToken') || null)
  const email = ref(localStorage.getItem('email') || null)
  const role = ref(localStorage.getItem('role') || null)
  const chatRoomIds = ref(JSON.parse(localStorage.getItem('chatRoomIds') || '[]'))
  const profileImageUrl = ref(localStorage.getItem('profileImageUrl') || null)
  const jobCategory = ref(localStorage.getItem('jobCategory') || null)
  const isExternalJobRecommendationStale = ref(
    localStorage.getItem('externalJobRecommendationStale') === 'true',
  )

  const isLoggedIn = computed(() => !!token.value)
  const isFreelancer = computed(() => role.value === 'USER')
  const isCompany = computed(() => role.value === 'COMPANY')

  function login(data) {
    token.value = data.accessToken
    email.value = data.email
    role.value = data.role
    chatRoomIds.value = data.chatRoomIds || []
    profileImageUrl.value = data.profileImageUrl || null
    setJobCategory(data.jobCategory)
    clearExternalJobRecommendationStale()

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

  function setJobCategory(value) {
    jobCategory.value = value || null
    if (jobCategory.value) localStorage.setItem('jobCategory', jobCategory.value)
    else localStorage.removeItem('jobCategory')
  }

  function updateJobCategory(value, { markExternalJobsStale = true } = {}) {
    const nextJobCategory = value || null
    const hasChanged = jobCategory.value !== nextJobCategory
    setJobCategory(nextJobCategory)
    if (hasChanged && markExternalJobsStale) markExternalJobRecommendationStale()
  }

  function markExternalJobRecommendationStale() {
    isExternalJobRecommendationStale.value = true
    localStorage.setItem('externalJobRecommendationStale', 'true')
  }

  function clearExternalJobRecommendationStale() {
    isExternalJobRecommendationStale.value = false
    localStorage.removeItem('externalJobRecommendationStale')
  }

  function logout() {
    token.value = null
    email.value = null
    role.value = null
    chatRoomIds.value = []
    profileImageUrl.value = null
    setJobCategory(null)
    clearExternalJobRecommendationStale()
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
    jobCategory,
    isExternalJobRecommendationStale,
    isLoggedIn,
    isFreelancer,
    isCompany,
    login,
    logout,
    updateProfileImage,
    updateJobCategory,
    markExternalJobRecommendationStale,
    clearExternalJobRecommendationStale,
  }
})
