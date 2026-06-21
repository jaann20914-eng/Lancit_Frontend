import httpClient from '@/shared/api/httpClient.js'

// 파일 업로드 (포트폴리오, 컨펌파일, 프로필 이미지 등 공통)
// parentType: PROFILE | PORTFOLIO_BANNER | PORTFOLIO_FILE | CONTRACT | CHAT | TEMP
export function uploadFile(file, parentType, parentId) {
  const formData = new FormData()
  formData.append('files', file)
  formData.append('parentType', parentType)
  if (parentId !== undefined && parentId !== null) {
    formData.append('parentId', parentId)
  }
  return httpClient.post('/files/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

// 파일 다운로드(Signed) URL 조회
export function getDownloadUrl(fileId) {
  return httpClient.get(`/files/${fileId}/url`)
}

// 파일 삭제
export function deleteFile(fileId) {
  return httpClient.delete(`/files/${fileId}`)
}
