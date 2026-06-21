import { reactive, watch } from 'vue'

// ContractDocumentForm.vue가 기대하는 형태로 document를 변환하는 공통 로직
// NegotiatingPanel(작성용) / InProgressPanel(읽기전용) 양쪽에서 재사용
export function useContractDocumentForm(documentRef) {
  const form = reactive({
    contractStartDate: '',
    contractEndDate: '',
    workLocation: '',
    workDescription: '',
    workDaysArr: [],
    workStartTime: '',
    workEndTime: '',
    breakTimeStart: '',
    breakTimeEnd: '',
    monthlyWage: 0,
    basePay: 0,
    basePayBasis: '',
    overtimePay: 0,
    overtimePayBasis: '',
    holidayPay: 0,
    holidayPayBasis: '',
    mealAllowance: 0,
    totalWage: 0,
    contractWrittenAt: '',
    partyA: '',
    representativeName: '',
    companyAddress: '',
    partyB: '',
    freelancerBirthDate: '',
    freelancerAddress: '',
    confirmSignerName: '',
    privacySignerName: '',
    representativeSignFileIds: [],
    freelancerSignFileIds: [],
    confirmSignFileIds: [],
    privacySignFileIds: [],
  })

  function extractSignatureList(doc, prefix) {
    const arrayKey = prefix + 's'
    if (Array.isArray(doc[arrayKey])) {
      return doc[arrayKey].map((item) =>
        typeof item === 'object' ? item : { fileId: item, previewUrl: null },
      )
    }
    const result = []
    let i = 1
    while (doc[`${prefix}${i}`] !== undefined && doc[`${prefix}${i}`] !== null) {
      result.push({ fileId: doc[`${prefix}${i}`], previewUrl: null })
      i++
    }
    return result
  }

  function loadDocumentIntoForm() {
    const doc = documentRef.value
    if (!doc) return

    const SKIP_KEYS = [
      'workDaysArr',
      'breakTimeStart',
      'breakTimeEnd',
      'representativeSignFileIds',
      'freelancerSignFileIds',
      'confirmSignFileIds',
      'privacySignFileIds',
    ]

    Object.keys(form).forEach((key) => {
      if (SKIP_KEYS.includes(key)) return
      if (doc[key] !== undefined && doc[key] !== null) {
        form[key] = doc[key]
      }
    })

    if (doc.workDays) {
      form.workDaysArr = String(doc.workDays)
        .split(',')
        .map((d) => d.trim())
        .filter(Boolean)
    }

    form.breakTimeStart = doc.breakTimeStart || doc.breakTime || ''
    form.breakTimeEnd = doc.breakTimeEnd || ''

    form.representativeSignFileIds = extractSignatureList(doc, 'representativeSignFileId')
    form.freelancerSignFileIds = extractSignatureList(doc, 'freelancerSignFileId')
    form.confirmSignFileIds = extractSignatureList(doc, 'confirmSignFileId')
    form.privacySignFileIds = extractSignatureList(doc, 'privacySignFileId')
  }

  watch(documentRef, loadDocumentIntoForm, { immediate: true, deep: true })

  return { form }
}
