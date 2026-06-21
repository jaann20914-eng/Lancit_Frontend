import httpClient from '@/shared/api/httpClient.js'

// ============================================================
// REST API (목록 조회 / 삭제 / 수정)
// ============================================================

// 메시지 목록 조회 (무한스크롤, 기본 30개)
// GET /contracts/{contractId}/messages?cursor=&size=
export function getMessages(contractId, { cursor, size } = {}) {
  return httpClient.get(`/contracts/${contractId}/messages`, {
    params: { cursor, size }
  })
}

// 메시지 삭제
// DELETE /contracts/{contractId}/messages/{messageId}
export function deleteMessage(contractId, messageId) {
  return httpClient.delete(`/contracts/${contractId}/messages/${messageId}`)
}

// 메시지 수정
// PUT /contracts/{contractId}/messages/{messageId}  body: { content }
export function updateMessage(contractId, messageId, content) {
  return httpClient.put(`/contracts/${contractId}/messages/${messageId}`, { content })
}