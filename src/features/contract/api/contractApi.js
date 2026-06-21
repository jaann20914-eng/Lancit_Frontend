// ============================================================
// contractApi.js - 더미 데이터 버전 (계약 상태별 화면 확인용)
// 실제 연동 시 이 파일 내용을 원래 contractApi.js로 교체하세요
// ============================================================

const ME_FREELANCER = 'jane@example.com'   // 현재 로그인한 프리랜서로 가정
const ME_COMPANY = 'company@example.com'   // 현재 로그인한 회사로 가정

// 상태별 계약 1개씩 (총 8개)
const MOCK_CONTRACTS = [
  {
    contractId: 1,
    status: 'WAITING',
    companyEmail: 'company@example.com',
    freelancerEmail: ME_FREELANCER,
    recruitmentId: 101,
    recruitmentTitle: '모바일 앱 UI/UX 디자인',
  },
  {
    contractId: 2,
    status: 'NEGOTIATING_A',
    companyEmail: 'company@example.com',
    freelancerEmail: ME_FREELANCER,
    recruitmentId: 102,
    recruitmentTitle: '브랜드 아이덴티티 디자인',
  },
  {
    contractId: 3,
    status: 'NEGOTIATING_B',
    companyEmail: 'company@example.com',
    freelancerEmail: ME_FREELANCER,
    recruitmentId: 103,
    recruitmentTitle: '웹사이트 리디자인 프로젝트',
  },
  {
    contractId: 4,
    status: 'NEGOTIATING_C',
    companyEmail: 'company@example.com',
    freelancerEmail: ME_FREELANCER,
    recruitmentId: 104,
    recruitmentTitle: 'SaaS 대시보드 개발',
  },
  {
    contractId: 5,
    status: 'IN_PROGRESS',
    companyEmail: 'company@example.com',
    freelancerEmail: ME_FREELANCER,
    recruitmentId: 105,
    recruitmentTitle: '이커머스 웹사이트 리뉴얼',
  },
  {
    contractId: 6,
    status: 'COMPLETED_PENDING',
    companyEmail: 'company@example.com',
    freelancerEmail: ME_FREELANCER,
    recruitmentId: 106,
    recruitmentTitle: '레스토랑 브랜딩 프로젝트',
  },
  {
    contractId: 7,
    status: 'COMPLETED',
    companyEmail: 'company@example.com',
    freelancerEmail: ME_FREELANCER,
    recruitmentId: 107,
    recruitmentTitle: '개인 포트폴리오 사이트',
  },
  {
    contractId: 8,
    status: 'CANCELLED',
    companyEmail: 'company@example.com',
    freelancerEmail: ME_FREELANCER,
    recruitmentId: 108,
    recruitmentTitle: 'SNS 캠페인 디자인',
  },
]

// 계약 상세 (contract_document 포함, 상태별로 다른 내용)
const MOCK_DETAIL = {
  1: {
    contract_id: 1, recruitment_id: 101, status: 'WAITING',
    company_email: 'company@example.com', freelancer_email: ME_FREELANCER,
    recruitment_title: '모바일 앱 UI/UX 디자인', chat_room_id: 1,
    document: null, confirmFiles: [], pdfFile: null, cancelRequest: null,
  },
  2: {
    contract_id: 2, recruitment_id: 102, status: 'NEGOTIATING_A',
    company_email: 'company@example.com', freelancer_email: ME_FREELANCER,
    recruitment_title: '브랜드 아이덴티티 디자인', chat_room_id: 2,
    document: {
      contractId: 2, partyA: null, representativeName: null, companyAddress: null,
      partyB: null, freelancerBirthDate: null, freelancerAddress: null,
      workLocation: null, workDescription: null, workDays: null,
      workStartTime: null, workEndTime: null, breakTime: null,
      contractStartDate: null, contractEndDate: null,
      monthlyWage: 0, basePay: 0, basePayBasis: null,
      overtimePay: 0, overtimePayBasis: null,
      holidayPay: 0, holidayPayBasis: null,
      mealAllowance: 0, totalWage: 0,
      representativeSignFileId: null, freelancerSignFileId: null,
      contractWrittenAt: null, confirmedAt: null,
    },
    confirmFiles: [], pdfFile: null, cancelRequest: null,
  },
  3: {
    contract_id: 3, recruitment_id: 103, status: 'NEGOTIATING_B',
    company_email: 'company@example.com', freelancer_email: ME_FREELANCER,
    recruitment_title: '웹사이트 리디자인 프로젝트', chat_room_id: 3,
    document: {
      contractId: 3, partyA: '(주)랜싯테크', representativeName: '김대표', companyAddress: '서울특별시 강남구 테헤란로 123',
      partyB: null, freelancerBirthDate: null, freelancerAddress: null,
      workLocation: '서울 (재택 가능)', workDescription: '웹사이트 전면 리디자인 및 모던한 UI 적용',
      workDays: 'MON,TUE,WED,THU,FRI',
      workStartTime: '09:00:00', workEndTime: '18:00:00', breakTime: '12:00:00',
      contractStartDate: '2026-07-01', contractEndDate: '2026-09-30',
      monthlyWage: 3000000, basePay: 2500000, basePayBasis: '160:00:00',
      overtimePay: 300000, overtimePayBasis: '10:00:00',
      holidayPay: 100000, holidayPayBasis: '08:00:00',
      mealAllowance: 100000, totalWage: 3000000,
      representativeSignFileId: null, freelancerSignFileId: null,
      contractWrittenAt: null, confirmedAt: null,
    },
    confirmFiles: [], pdfFile: null, cancelRequest: null,
  },
  4: {
    contract_id: 4, recruitment_id: 104, status: 'NEGOTIATING_C',
    company_email: 'company@example.com', freelancer_email: ME_FREELANCER,
    recruitment_title: 'SaaS 대시보드 개발', chat_room_id: 4,
    document: {
      contractId: 4, partyA: '(주)랜싯테크', representativeName: '김대표', companyAddress: '서울특별시 강남구 테헤란로 123',
      partyB: '박지원', freelancerBirthDate: '1995-03-15', freelancerAddress: '서울특별시 마포구 양화로 45',
      workLocation: '서울 (재택 가능)', workDescription: 'SaaS 대시보드 프론트엔드 개발',
      workDays: 'MON,TUE,WED,THU,FRI',
      workStartTime: '09:00:00', workEndTime: '18:00:00', breakTime: '12:00:00',
      contractStartDate: '2026-07-01', contractEndDate: '2026-12-31',
      monthlyWage: 4000000, basePay: 3500000, basePayBasis: '160:00:00',
      overtimePay: 300000, overtimePayBasis: '10:00:00',
      holidayPay: 100000, holidayPayBasis: '08:00:00',
      mealAllowance: 100000, totalWage: 4000000,
      representativeSignFileId: null, freelancerSignFileId: null,
      contractWrittenAt: null, confirmedAt: null,
    },
    confirmFiles: [], pdfFile: null, cancelRequest: null,
  },
  5: {
    contract_id: 5, recruitment_id: 105, status: 'IN_PROGRESS',
    company_email: 'company@example.com', freelancer_email: ME_FREELANCER,
    recruitment_title: '이커머스 웹사이트 리뉴얼', chat_room_id: 5,
    document: {
      contractId: 5, partyA: '(주)이커머스랩', representativeName: '이대표', companyAddress: '서울특별시 서초구 서초대로 99',
      partyB: '박지원', freelancerBirthDate: '1995-03-15', freelancerAddress: '서울특별시 마포구 양화로 45',
      workLocation: '서울 (재택 가능)', workDescription: '이커머스 플랫폼 UI/UX 전면 개편',
      workDays: 'MON,TUE,WED,THU,FRI',
      workStartTime: '09:00:00', workEndTime: '18:00:00', breakTime: '12:00:00',
      contractStartDate: '2026-06-01', contractEndDate: '2026-08-31',
      monthlyWage: 3500000, basePay: 3000000, basePayBasis: '160:00:00',
      overtimePay: 300000, overtimePayBasis: '10:00:00',
      holidayPay: 100000, holidayPayBasis: '08:00:00',
      mealAllowance: 100000, totalWage: 3500000,
      representativeSignFileId: 901, freelancerSignFileId: 902,
      contractWrittenAt: '2026-06-01T10:00:00', confirmedAt: '2026-06-01T10:30:00',
    },
    confirmFiles: [
      { contractFileId: 11, contractId: 5, fileId: 201, type: 'CONFIRM', uploaderEmail: ME_FREELANCER, createdAt: '2026-06-10T14:08:00' },
      { contractFileId: 12, contractId: 5, fileId: 202, type: 'CONFIRM', uploaderEmail: ME_FREELANCER, createdAt: '2026-06-12T09:20:00' },
    ],
    pdfFile: { contractFileId: 10, contractId: 5, fileId: 200, type: 'PDF', uploaderEmail: null, createdAt: '2026-06-01T10:30:00' },
    cancelRequest: null,
  },
  6: {
    contract_id: 6, recruitment_id: 106, status: 'COMPLETED_PENDING',
    company_email: 'company@example.com', freelancer_email: ME_FREELANCER,
    recruitment_title: '레스토랑 브랜딩 프로젝트', chat_room_id: 6,
    document: {
      contractId: 6, partyA: '(주)미식그룹', representativeName: '최대표', companyAddress: '서울특별시 종로구 종로 12',
      partyB: '박지원', freelancerBirthDate: '1995-03-15', freelancerAddress: '서울특별시 마포구 양화로 45',
      workLocation: '서울', workDescription: '레스토랑 브랜드 아이덴티티 및 메뉴판 디자인',
      workDays: 'MON,TUE,WED,THU,FRI',
      workStartTime: '09:00:00', workEndTime: '18:00:00', breakTime: '12:00:00',
      contractStartDate: '2026-04-01', contractEndDate: '2026-05-31',
      monthlyWage: 2000000, basePay: 1800000, basePayBasis: '160:00:00',
      overtimePay: 100000, overtimePayBasis: '10:00:00',
      holidayPay: 50000, holidayPayBasis: '08:00:00',
      mealAllowance: 50000, totalWage: 2000000,
      representativeSignFileId: 903, freelancerSignFileId: 904,
      contractWrittenAt: '2026-04-01T10:00:00', confirmedAt: '2026-04-01T10:30:00',
    },
    confirmFiles: [
      { contractFileId: 13, contractId: 6, fileId: 203, type: 'CONFIRM', uploaderEmail: ME_FREELANCER, createdAt: '2026-05-20T11:00:00' },
    ],
    pdfFile: { contractFileId: 14, contractId: 6, fileId: 204, type: 'PDF', uploaderEmail: null, createdAt: '2026-04-01T10:30:00' },
    cancelRequest: null,
  },
  7: {
    contract_id: 7, recruitment_id: 107, status: 'COMPLETED',
    company_email: 'company@example.com', freelancer_email: ME_FREELANCER,
    recruitment_title: '개인 포트폴리오 사이트', chat_room_id: 7,
    document: {
      contractId: 7, partyA: '(주)개인클라이언트', representativeName: '정대표', companyAddress: '서울특별시 강서구 화곡로 5',
      partyB: '박지원', freelancerBirthDate: '1995-03-15', freelancerAddress: '서울특별시 마포구 양화로 45',
      workLocation: '서울 (재택)', workDescription: '개인 포트폴리오 웹사이트 제작',
      workDays: 'MON,TUE,WED,THU,FRI',
      workStartTime: '09:00:00', workEndTime: '18:00:00', breakTime: '12:00:00',
      contractStartDate: '2026-03-01', contractEndDate: '2026-03-31',
      monthlyWage: 1500000, basePay: 1300000, basePayBasis: '160:00:00',
      overtimePay: 100000, overtimePayBasis: '10:00:00',
      holidayPay: 50000, holidayPayBasis: '08:00:00',
      mealAllowance: 50000, totalWage: 1500000,
      representativeSignFileId: 905, freelancerSignFileId: 906,
      contractWrittenAt: '2026-03-01T10:00:00', confirmedAt: '2026-03-01T10:30:00',
    },
    confirmFiles: [
      { contractFileId: 15, contractId: 7, fileId: 205, type: 'CONFIRM', uploaderEmail: ME_FREELANCER, createdAt: '2026-03-25T14:00:00' },
    ],
    pdfFile: { contractFileId: 16, contractId: 7, fileId: 206, type: 'PDF', uploaderEmail: null, createdAt: '2026-03-01T10:30:00' },
    cancelRequest: null,
  },
  8: {
    contract_id: 8, recruitment_id: 108, status: 'CANCELLED',
    company_email: 'company@example.com', freelancer_email: ME_FREELANCER,
    recruitment_title: 'SNS 캠페인 디자인', chat_room_id: 8,
    document: {
      contractId: 8, partyA: '(주)마케팅허브', representativeName: '한대표', companyAddress: '서울특별시 송파구 올림픽로 300',
      partyB: '박지원', freelancerBirthDate: '1995-03-15', freelancerAddress: '서울특별시 마포구 양화로 45',
      workLocation: '서울 (재택)', workDescription: 'SNS 캠페인 비주얼 디자인',
      workDays: 'MON,TUE,WED,THU,FRI',
      workStartTime: '09:00:00', workEndTime: '18:00:00', breakTime: '12:00:00',
      contractStartDate: '2026-05-01', contractEndDate: '2026-05-31',
      monthlyWage: 1000000, basePay: 900000, basePayBasis: '160:00:00',
      overtimePay: 50000, overtimePayBasis: '10:00:00',
      holidayPay: 30000, holidayPayBasis: '08:00:00',
      mealAllowance: 20000, totalWage: 1000000,
      representativeSignFileId: null, freelancerSignFileId: null,
      contractWrittenAt: null, confirmedAt: null,
    },
    confirmFiles: [], pdfFile: null,
    cancelRequest: {
      contractId: 8, requesterEmail: 'company@example.com', requestedAt: '2026-05-15T09:00:00'
    },
  },
}

function delay(ms = 300) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// ============================================================
// 조회 관련
// ============================================================

export async function getContracts({ status, keywordType, keyword, page = 1, size = 5 }) {
  await delay()

  let list = [...MOCK_CONTRACTS]

  if (status) {
    list = list.filter(c => c.status === status)
  }
  if (keyword) {
    list = list.filter(c => {
      if (keywordType === 'title') return c.recruitmentTitle.includes(keyword)
      if (keywordType === 'company') return c.companyEmail.includes(keyword)
      if (keywordType === 'freelancer') return c.freelancerEmail.includes(keyword)
      return (
        c.recruitmentTitle.includes(keyword) ||
        c.companyEmail.includes(keyword) ||
        c.freelancerEmail.includes(keyword)
      )
    })
  }

  const start = (page - 1) * size
  const pageContent = list.slice(start, start + size)

  return {
    data: {
      data: {
        content: pageContent,
        totalPages: Math.max(1, Math.ceil(list.length / size))
      }
    }
  }
}

export async function getContractDetail(contractId) {
  await delay()
  const detail = MOCK_DETAIL[contractId]
  if (!detail) {
    const err = new Error('Not Found')
    err.response = { status: 404, data: { message: '계약을 찾을 수 없습니다.' } }
    throw err
  }
  return { data: { data: detail } }
}

export async function saveDraft(contractId, data) {
  await delay()
  console.log('[MOCK] saveDraft', contractId, data)
  return { data: { data: null } }
}

export async function rejectContract(contractId) {
  await delay()
  console.log('[MOCK] rejectContract', contractId)
  return { data: { data: null } }
}

// ============================================================
// 상태 변경 관련
// ============================================================

export async function createContract({ recruitmentId, freelancerEmail }) {
  await delay()
  console.log('[MOCK] createContract', { recruitmentId, freelancerEmail })
  return { data: { data: { contractId: 999 } } }
}

export async function startContract(contractId) {
  await delay()
  console.log('[MOCK] startContract', contractId)
  return { data: { data: null } }
}

export async function sendByCompany(contractId, data) {
  await delay()
  console.log('[MOCK] sendByCompany', contractId, data)
  return { data: { data: null } }
}

export async function sendByFreelancer(contractId, data) {
  await delay()
  console.log('[MOCK] sendByFreelancer', contractId, data)
  return { data: { data: null } }
}

export async function approveContract(contractId) {
  await delay()
  console.log('[MOCK] approveContract', contractId)
  return { data: { data: null } }
}

export async function completeContract(contractId) {
  await delay()
  console.log('[MOCK] completeContract', contractId)
  return { data: { data: null } }
}

// ============================================================
// 계약 파기
// ============================================================

export async function requestCancel(contractId) {
  await delay()
  console.log('[MOCK] requestCancel', contractId)
  return { data: { data: null } }
}

export async function cancelContract(contractId) {
  await delay()
  console.log('[MOCK] cancelContract', contractId)
  return { data: { data: null } }
}

// ============================================================
// 계약서 PDF
// ============================================================

export async function getPdfDownloadUrl(contractId) {
  await delay()
  return {
    data: {
      data: {
        contractFileId: 10,
        fileId: 200,
        downloadUrl: 'https://example.com/mock-contract.pdf'
      }
    }
  }
}

// ============================================================
// 컨펌 파일
// ============================================================

export async function uploadConfirmFile(contractId, fileId) {
  await delay()
  console.log('[MOCK] uploadConfirmFile', contractId, fileId)
  return { data: { data: null } }
}

export async function getConfirmFiles(contractId) {
  await delay()
  const detail = MOCK_DETAIL[contractId]
  return { data: { data: detail?.confirmFiles || [] } }
}

export async function deleteConfirmFile(contractId, contractFileId) {
  await delay()
  console.log('[MOCK] deleteConfirmFile', contractId, contractFileId)
  return { data: { data: null } }
}





// 백엔드 연동후 아래 주석 해제
// import httpClient from '@/shared/api/httpClient.js'

// // ============================================================
// // 조회 관련
// // ============================================================

// // 계약 목록 조회
// // GET /contracts?status=&keywordType=&keyword=&page=&size=
// export function getContracts({ status, keywordType, keyword, page, size }) {
//   return httpClient.get('/contracts', {
//     params: { status, keywordType, keyword, page, size }
//   })
// }

// // 계약 상세 조회
// // GET /contracts/{contractId}
// export function getContractDetail(contractId) {
//   return httpClient.get(`/contracts/${contractId}`)
// }

// // 계약 문서 임시 저장
// // PUT /contracts/{contractId}/draft
// export function saveDraft(contractId, data) {
//   return httpClient.put(`/contracts/${contractId}/draft`, data)
// }

// // 제안 거절 (WAITING -> 완전 삭제, 프리랜서 전용)
// // PUT /contracts/{contractId}/reject
// export function rejectContract(contractId) {
//   return httpClient.put(`/contracts/${contractId}/reject`)
// }

// // ============================================================
// // 상태 변경 관련
// // ============================================================

// // 계약 생성 (WAITING 삽입, 회사 -> 프리랜서)
// // POST /contracts  body: { recruitmentId, freelancerEmail }
// export function createContract({ recruitmentId, freelancerEmail }) {
//   return httpClient.post('/contracts', { recruitmentId, freelancerEmail })
// }

// // 계약 작성 시작 (WAITING -> NEGOTIATING_A, 회사 전용)
// // PUT /contracts/{contractId}/start
// export function startContract(contractId) {
//   return httpClient.put(`/contracts/${contractId}/start`)
// }

// // 회사 계약서 발송 (NEGOTIATING_A -> NEGOTIATING_B)
// // PUT /contracts/{contractId}/send-company
// export function sendByCompany(contractId, data) {
//   return httpClient.put(`/contracts/${contractId}/send-company`, data)
// }

// // 프리랜서 계약서 발송 (NEGOTIATING_B -> NEGOTIATING_C)
// // PUT /contracts/{contractId}/send-freelancer
// export function sendByFreelancer(contractId, data) {
//   return httpClient.put(`/contracts/${contractId}/send-freelancer`, data)
// }

// // 계약 최종 승인 (NEGOTIATING_C -> IN_PROGRESS, 회사 전용, PDF 생성)
// // PUT /contracts/{contractId}/approve
// export function approveContract(contractId) {
//   return httpClient.put(`/contracts/${contractId}/approve`)
// }

// // 계약 완료 (COMPLETED_PENDING -> COMPLETED, 회사 전용)
// // PUT /contracts/{contractId}/complete
// export function completeContract(contractId) {
//   return httpClient.put(`/contracts/${contractId}/complete`)
// }

// // ============================================================
// // 계약 파기
// // ============================================================

// // 계약 파기 요청
// // POST /contracts/{contractId}/cancel-request
// export function requestCancel(contractId) {
//   return httpClient.post(`/contracts/${contractId}/cancel-request`)
// }

// // 계약 파기 확정 (요청 받은 사람만 가능)
// // PUT /contracts/{contractId}/cancel
// export function cancelContract(contractId) {
//   return httpClient.put(`/contracts/${contractId}/cancel`)
// }

// // ============================================================
// // 계약서 PDF
// // ============================================================

// // 저장된 PDF 다운로드 URL 조회
// // GET /contracts/{contractId}/pdf
// export function getPdfDownloadUrl(contractId) {
//   return httpClient.get(`/contracts/${contractId}/pdf`)
// }

// // ============================================================
// // 컨펌 파일
// // ============================================================

// // 컨펌파일 업로드 (IN_PROGRESS 상태, 프리랜서만)
// // POST /contracts/{contractId}/confirm-files  body: { fileId }
// export function uploadConfirmFile(contractId, fileId) {
//   return httpClient.post(`/contracts/${contractId}/confirm-files`, { fileId })
// }

// // 컨펌파일 목록 조회
// // GET /contracts/{contractId}/confirm-files
// export function getConfirmFiles(contractId) {
//   return httpClient.get(`/contracts/${contractId}/confirm-files`)
// }

// // 컨펌파일 삭제 (IN_PROGRESS 상태, 프리랜서만)
// // DELETE /contracts/{contractId}/confirm-files/{contractFileId}
// export function deleteConfirmFile(contractId, contractFileId) {
//   return httpClient.delete(`/contracts/${contractId}/confirm-files/${contractFileId}`)
// }