import { reactive, watch } from 'vue'

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
    overtimePay: 0,
    holidayPay: 0,
    basePayBasisHour: null,
    overtimePayBasisHour: null,
    holidayPayBasisHour: null,
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
    representativeSignFileId: null,
    contractSignFileId: null,
    confirmSignFileId: null,
    privacySignFileId: null,
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

  function minutesToTime(minutes) {
    if (minutes == null) return ''

    const h = String(Math.floor(minutes / 60)).padStart(2, '0')
    const m = String(minutes % 60).padStart(2, '0')

    return `${h}:${m}`
  }

  function loadDocumentIntoForm() {
    const doc = documentRef.value
    if (!doc) return

    const SKIP_KEYS = [
      'workDaysArr',
      'breakTimeStart',
      'breakTimeEnd',
      'basePayBasisHour',
      'basePayBasisMinute',
      'overtimePayBasis',
      'holidayPayBasis',
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

    form.basePayBasisHour =
      doc.basePayBasisMinutes == null ? null : Math.floor(doc.basePayBasisMinutes / 60)

    form.overtimePayBasisHour =
      doc.overtimePayBasisMinutes == null ? null : Math.floor(doc.overtimePayBasisMinutes / 60)

    form.holidayPayBasisHour =
      doc.holidayPayBasisMinutes == null ? null : Math.floor(doc.holidayPayBasisMinutes / 60)

    console.log(documentRef.value)
    console.log(form.representativeSignFileId)
    console.log(form.representativeSignFileIds)
  }

  watch(
    documentRef,
    (newVal) => {
      console.log('documentRef 변경됨', newVal)
      loadDocumentIntoForm()
    },
    {
      immediate: true,
      deep: true,
    },
  )

  return { form }
}
