import httpClient from '@/shared/api/httpClient.js'

// ============================================================
// 제안 관련
// ============================================================

// 제안 목록 조회 (프리랜서 전용, PROPOSAL 상태)
// GET /contracts/proposals
export function getProposals({ keywordType, keyword, page, size, sort }) {
  return httpClient.get('/contracts/proposals', {
    params: { keywordType, keyword, page, size, sort },
  })
}

// 제안 수락 (PROPOSAL -> WAITING, 프리랜서 전용)
// PUT /contracts/{contractId}/accept
export function acceptProposal(contractId) {
  return httpClient.put(`/contracts/${contractId}/accept`)
}

// 회사가 지원 수락 시 PROPOSAL -> WAITING (회사 전용)
// PUT /contracts/{contractId}/accept-by-company
export function acceptProposalByCompany(contractId) {
  return httpClient.put(`/contracts/${contractId}/accept-by-company`)
}

// POST /contracts/accept-application
export function acceptApplication({ recruitmentId, freelancerEmail, applicationId }) {
  return httpClient.post('/contracts/accept-application', {
    recruitmentId,
    freelancerEmail,
    applicationId,
  })
}
// ============================================================
// 조회 관련
// ============================================================

// 계약 목록 조회
// GET /contracts?status=&keywordType=&keyword=&page=&size=
export function getContracts({ status, keywordType, keyword, page, size }) {
  return httpClient.get('/contracts', {
    params: { status, keywordType, keyword, page, size },
  })
}

// 계약 상세 조회
// GET /contracts/{contractId}
export function getContractDetail(contractId) {
  return httpClient.get(`/contracts/${contractId}`)
}

// 계약 문서 임시 저장
// PUT /contracts/{contractId}/draft
export function saveDraft(contractId, data) {
  return httpClient.put(`/contracts/${contractId}/draft`, data)
}

// 제안 거절 (WAITING -> 완전 삭제, 프리랜서 전용)
// PUT /contracts/{contractId}/reject
export function rejectContract(contractId) {
  return httpClient.put(`/contracts/${contractId}/reject`)
}

// ============================================================
// 상태 변경 관련
// ============================================================

// 계약 생성 (PROPOSE 삽입, 회사 -> 프리랜서)
// POST /contracts  body: { recruitmentId, freelancerEmail }
export function createContract({ recruitmentId, freelancerEmail }) {
  //백엔드에서 proposeFreelancer
  return httpClient.post('/contracts', { recruitmentId, freelancerEmail })
}

// 계약 작성 시작 (WAITING -> NEGOTIATING_A, 회사 전용)
// PUT /contracts/{contractId}/start
export function startContract(contractId) {
  return httpClient.put(`/contracts/${contractId}/start`)
}

// 회사 계약서 발송 (NEGOTIATING_A -> NEGOTIATING_B)
// PUT /contracts/{contractId}/send-company
export function sendByCompany(contractId, data) {
  return httpClient.put(`/contracts/${contractId}/send-company`, data)
}

// 프리랜서 계약서 발송 (NEGOTIATING_B -> NEGOTIATING_C)
// PUT /contracts/{contractId}/send-freelancer
export function sendByFreelancer(contractId, data) {
  return httpClient.put(`/contracts/${contractId}/send-freelancer`, data)
}

// 계약 최종 승인 (NEGOTIATING_C -> IN_PROGRESS, 회사 전용, PDF 생성)
// PUT /contracts/{contractId}/approve
export function approveContract(contractId) {
  return httpClient.put(`/contracts/${contractId}/approve`)
}

// 계약 완료 (COMPLETED_PENDING -> COMPLETED, 회사 전용)
// PUT /contracts/{contractId}/complete
export function completeContract(contractId) {
  return httpClient.put(`/contracts/${contractId}/complete`)
}

// ============================================================
// 계약 파기
// ============================================================

// 계약 파기 요청
// POST /contracts/{contractId}/cancel-request
export function requestCancel(contractId) {
  return httpClient.post(`/contracts/${contractId}/cancel-request`)
}

// 계약 파기 확정 (요청 받은 사람만 가능)
// PUT /contracts/{contractId}/cancel
export function cancelContract(contractId) {
  return httpClient.put(`/contracts/${contractId}/cancel`)
}

// ============================================================
// 계약서 PDF
// ============================================================

// 저장된 PDF 다운로드 URL 조회
// GET /contracts/{contractId}/pdf
export function getPdfDownloadUrl(contractId) {
  return httpClient.get(`/contracts/${contractId}/pdf`)
}

// ============================================================
// 컨펌 파일
// ============================================================

// 컨펌파일 업로드 (IN_PROGRESS 상태, 프리랜서만)
// POST /contracts/{contractId}/confirm-files  body: { fileId }
export function uploadConfirmFile(contractId, fileId) {
  return httpClient.post(`/contracts/${contractId}/confirm-files`, { fileId })
}

// 컨펌파일 목록 조회
// GET /contracts/{contractId}/confirm-files
export function getConfirmFiles(contractId) {
  return httpClient.get(`/contracts/${contractId}/confirm-files`)
}

// 컨펌파일 삭제 (IN_PROGRESS 상태, 프리랜서만)
// DELETE /contracts/{contractId}/confirm-files/{contractFileId}
export function deleteConfirmFile(contractId, contractFileId) {
  return httpClient.delete(`/contracts/${contractId}/confirm-files/${contractFileId}`)
}

//계약서pdf 다운로드
export function downloadContractPdf(contractId) {
  return httpClient.get(`/contracts/${contractId}/pdf/download`, {
    responseType: 'blob',
  })
}

// 파일 업로드
export function uploadFile(file) {
  const formData = new FormData()
  formData.append('files', file)
  formData.append('parentType', 'CONTRACT')
  return httpClient.post('/files/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

// 컨펌파일 다운로드 URL 조회
export function getFileDownloadUrl(fileId) {
  return httpClient.get(`/files/${fileId}/download`, {
    responseType: 'blob',
  })
}
