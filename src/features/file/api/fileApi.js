import httpClient from '@/shared/api/httpClient.js'

// 파일 업로드 (프로필 이미지는 parentType=TEMP, parentId=null로 먼저 올림)
// 저장(PUT /user(company)/me) 시점에 백엔드가 TEMP -> PROFILE 로 승격 처리
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
export function getFileUrl(fileId) {
  return httpClient.get(`/files/${fileId}/url`)
}

// 파일 삭제
export function deleteFile(fileId) {
  return httpClient.delete(`/files/${fileId}`)
}
