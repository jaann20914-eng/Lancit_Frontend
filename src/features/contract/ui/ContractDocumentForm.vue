<template>
  <div class="doc-page">
    <div class="doc-title-row">
      <div class="logo-area">Logo</div>
      <div class="doc-title">프리랜서 근로계약서</div>
      <div class="logo-area"></div>
    </div>

    <div class="preamble">
      <input
        v-model="form.partyA"
        type="text"
        class="val val-lg"
        :class="{ 'val-error': isFieldEmpty('partyA', true) }"
        placeholder="회사명"
        :disabled="!canEditCompanyFields"
      />
      (이하 '갑'이라 함)와 프리랜서
      <input
        v-model="form.partyB"
        type="text"
        class="val val-md"
        :class="{ 'val-error': isFieldEmpty('partyB', true) }"
        placeholder="성명"
        :disabled="!canEditCompanyFields"
      />
      (이하 '을'이라 함)는(은) 다음과 같이 근로 계약을 체결하고 이를 성실히 이행할 것을 약정한다.
    </div>

    <div class="article">
      <div class="article-title">제 1 조 【계약기간】</div>
      <div class="clause-text">
        근로계약기간은
        <input
          v-model="form.contractStartDate"
          type="date"
          class="val val-md"
          :class="{ 'val-error': isFieldEmpty('contractStartDate', true) }"
          :min="todayStr"
          :disabled="!canEditCompanyFields"
          @change="handleStartDateChange"
        />
        부터
        <input
          v-model="form.contractEndDate"
          type="date"
          class="val val-md"
          :class="{ 'val-error': isFieldEmpty('contractEndDate', true) }"
          :min="form.contractStartDate || todayStr"
          :disabled="!canEditCompanyFields"
        />
        까지로 한다.
      </div>
    </div>

    <div class="article">
      <div class="article-title">제 2 조 【근무 장소 및 업무내용】</div>
      <div class="clause">
        <span class="clause-num">①</span>
        <span class="clause-text"
          >'을'의 근무 장소 :
          <input
            v-model="form.workLocation"
            type="text"
            class="val val-lg"
            :class="{ 'val-error': isFieldEmpty('workLocation', true) }"
            :disabled="!canEditCompanyFields"
          />
        </span>
      </div>
      <div class="clause">
        <span class="clause-num">②</span>
        <span class="clause-text"
          >'을'의 업무 내용 :
          <input
            v-model="form.workDescription"
            type="text"
            class="val val-lg"
            :class="{ 'val-error': isFieldEmpty('workDescription', true) }"
            :disabled="!canEditCompanyFields"
          />
        </span>
      </div>
      <div class="clause">
        <span class="clause-num">③</span>
        <span class="clause-text"
          >'갑'은 필요한 경우 '을'의 근무 장소 및 업무의 변경에 대해서 합의를 통해 변경이
          가능하다.</span
        >
      </div>
    </div>

    <div class="article">
      <div class="article-title">제 3 조 【근로시간 및 휴게시간】</div>
      <div class="clause">
        <span class="clause-num">①</span>
        <span class="clause-text"
          >근로시간은 하루 최대 8시간에 휴일근무를 포함한 연장근로를 총 12시간까지 허용하여
          주52시간제를 원칙으로 하며, 근무시간 및 휴게시간은 다음과 같다.</span
        >
      </div>

      <table class="work-table-vertical">
        <tbody>
          <tr>
            <th>근무일</th>
            <td
              class="workday-cell"
              :class="{ 'cell-warning': workDaysMissing && canEditCompanyFields }"
            >
              <label v-for="day in WEEKDAYS" :key="day.value" class="weekday-chip">
                <input
                  type="checkbox"
                  :value="day.value"
                  v-model="form.workDaysArr"
                  :disabled="!canEditCompanyFields"
                />
                {{ day.label }}
              </label>
            </td>
          </tr>
          <tr>
            <th>시업시간</th>
            <td>
              <input
                v-model="form.workStartTime"
                type="time"
                class="val-table"
                :class="{ 'val-error': isFieldEmpty('workStartTime', true) }"
                :disabled="!canEditCompanyFields"
              />
            </td>
          </tr>
          <tr>
            <th>종업시간</th>
            <td>
              <input
                v-model="form.workEndTime"
                type="time"
                class="val-table"
                :class="{ 'val-error': isFieldEmpty('workEndTime', true) }"
                :disabled="!canEditCompanyFields"
              />
              <span v-if="isOvernightShift" class="overnight-badge">익일</span>
            </td>
          </tr>
          <tr>
            <th>휴게시간</th>
            <td
              class="break-time-cell-v"
              :class="{ 'cell-warning': breakTimeMissing && canEditCompanyFields }"
            >
              <input
                v-model="form.breakTimeStart"
                type="time"
                class="val-table"
                :disabled="!canEditCompanyFields"
              />
              <span class="break-time-label">부터</span>
              <input
                v-model="form.breakTimeEnd"
                type="time"
                class="val-table"
                :disabled="!canEditCompanyFields"
              />
              <span class="break-time-label">까지</span>
            </td>
          </tr>
        </tbody>
      </table>
      <p v-if="isOvernightShift" class="overnight-note">
        ※ 종업시간이 시업시간보다 빠르므로 다음날로 근무가 이어지는 것으로 처리됩니다.
      </p>

      <div class="clause">
        <span class="clause-num">②</span>
        <span class="clause-text"
          >휴게시간은 1일 4시간인 경우 30분, 8시간인 경우 1시간의 휴게시간을 부여한다.</span
        >
      </div>
      <div class="clause">
        <span class="clause-num">③</span>
        <span class="clause-text"
          >근로시간 및 휴게시간은 업무사정에 따라 합의하에 변경할 수 있다.</span
        >
      </div>
      <div class="clause">
        <span class="clause-num">④</span>
        <span class="clause-text"
          >업무수행에 필요하다고 판단되는 경우 '갑'은 '을'과 합의하에 연장근로, 야간근로, 휴일근로를
          명할 수 있다.</span
        >
      </div>
    </div>

    <div class="article">
      <div class="article-title">제 4 조 【휴일 및 휴가】</div>
      <div class="clause">
        <span class="clause-num">①</span>
        <span class="clause-text"
          >주휴일은 매주 일요일로 한다. 다만, '갑'은 필요한 경우 주휴일을 다른 날로 대체할 수
          있으며, '을'은 이에 동의한다.</span
        >
      </div>
      <div class="clause">
        <span class="clause-num">②</span>
        <span class="clause-text"
          >주휴일,「근로자의 날 제정에 관한 법률」에 따른 근로자의 날(5월 1일)은 유급휴일로 한다.
          단, 주휴일의 경우는 '을'이 한 주 동안 계약서에 명시 된 근로시간을 개근한 경우에 한하며,
          주휴일과 유·무급 휴일이 중복되었을 경우에는 하나의 휴일만 적용한다.</span
        >
      </div>
      <div class="clause">
        <span class="clause-num">③</span>
        <span class="clause-text">연차유급휴가는 「근로기준법」에서 정하는 바에 따른다.</span>
      </div>
    </div>

    <div class="article">
      <div class="article-title">제 5 조 【계약금액】</div>
      <div class="clause">
        <span class="clause-num">①</span>
        <span class="clause-text"
          >계약금액은 근로계약기간동안 월급제를 원칙으로 하며, 월정급여액
          <input :value="formatAmount(form.monthlyWage)" readonly />
          원으로 한다.
        </span>
      </div>
      <div class="clause">
        <span class="clause-num">②</span>
        <span class="clause-text">월정급여액의 구성 내역은 다음과 같다.</span>
      </div>
    </div>

    <div class="salary-card-list">
      <div class="salary-card">
        <div class="salary-card-head">
          <span class="salary-item-name">기 본 급</span>
          <span class="salary-amount-wrap">
            <input
              :value="formatAmount(form.basePay)"
              type="text"
              class="val-amount no-spinner"
              :class="{ 'val-error': isFieldEmpty('basePay', true) }"
              :disabled="!canEditCompanyFields"
              @input="form.basePay = parseAmount($event.target.value)"
            />
            원
          </span>
        </div>
        <div class="salary-card-sub">
          <span class="salary-sub-label"> 월 소정근로시간 </span>
          <input
            v-model.number="form.basePayBasisHour"
            type="number"
            min="0"
            class="val-amount no-spinner"
            :class="{ 'val-error': basePayBasisMissing && canEditCompanyFields }"
            :disabled="!canEditCompanyFields"
          />

          시간
        </div>
      </div>

      <div class="salary-card">
        <div class="salary-card-head">
          <span class="salary-item-name">연장근로수당</span>
          <span class="salary-amount-wrap">
            <input
              :value="formatAmount(form.overtimePay)"
              @input="form.overtimePay = parseAmount($event.target.value)"
              type="text"
              min="0"
              class="val-amount no-spinner"
              :disabled="!canEditCompanyFields"
            />
            원
          </span>
        </div>
        <div class="salary-card-sub">
          <span class="salary-sub-label"> 연장근로시간 </span>

          <input
            v-model.number="form.overtimePayBasisHour"
            type="number"
            min="0"
            class="val-amount no-spinner"
            :disabled="!canEditCompanyFields"
          />
          시간
        </div>
      </div>

      <div class="salary-card">
        <div class="salary-card-head">
          <span class="salary-item-name">휴일근로수당</span>
          <span class="salary-amount-wrap">
            <input
              :value="formatAmount(form.holidayPay)"
              @input="form.holidayPay = parseAmount($event.target.value)"
              type="text"
              min="0"
              class="val-amount no-spinner"
              :disabled="!canEditCompanyFields"
            />
            원
          </span>
        </div>
        <div class="salary-card-sub">
          <span class="salary-sub-label"> 휴일근로시간 </span>

          <input
            v-model.number="form.holidayPayBasisHour"
            type="number"
            min="0"
            class="val-amount no-spinner"
            :disabled="!canEditCompanyFields"
          />

          시간
        </div>
      </div>

      <div class="salary-card">
        <div class="salary-card-head">
          <span class="salary-item-name">식 대</span>
          <span class="salary-amount-wrap">
            <input
              :value="formatAmount(form.mealAllowance)"
              @input="form.mealAllowance = parseAmount($event.target.value)"
              type="text"
              min="0"
              class="val-amount no-spinner"
              :disabled="!canEditCompanyFields"
            />
            원
          </span>
        </div>
        <div class="salary-card-sub">
          <span class="salary-note">비과세</span>
        </div>
      </div>

      <div class="salary-card salary-card-total">
        <div class="salary-card-head">
          <span class="salary-item-name">합 계</span>
          <span class="salary-amount-wrap">
            <input :value="formatAmount(form.totalWage)" readonly />
            원
          </span>
        </div>
      </div>
    </div>

    <div class="fixed-clauses">
      <div class="clause">
        <span class="clause-num">③</span
        ><span class="clause-text"
          >기본급은 월 소정근로시간에 대한 통상임금으로써 제 수당의 산정기준이 된다.</span
        >
      </div>
      <div class="clause">
        <span class="clause-num">④</span
        ><span class="clause-text"
          >상기 약정한 시간외 근로시간을 초과하는 실제근로를 하는 경우 그 초과한 부분에 대한 별도의
          수당을 지급한다.</span
        >
      </div>
      <div class="clause">
        <span class="clause-num">⑤</span
        ><span class="clause-text"
          >식대는 복리후생비로써, '을'의 근무기간이 1월 이상인 경우, 매월 15일 이상 출근한 경우에
          지급된다.</span
        >
      </div>
      <div class="clause">
        <span class="clause-num">⑥</span
        ><span class="clause-text"
          >'을'의 귀책사유로 인하여 근무하지 아니한 기간은 일할 산정하여 급여에서 공제하며, 결근,
          지각, 외출, 조퇴, 병가 등 근무하지 아니한 시간은 급여에서 당해 시간에 해당하는 금액을
          공제한다.</span
        >
      </div>
      <div class="clause">
        <span class="clause-num">⑦</span
        ><span class="clause-text"
          >임금은 월 지급총액에서 4대보험료, 소득세, 지방소득세를 공제한 후 매월 임금 지급일에
          지급한다.</span
        >
      </div>
      <div class="clause">
        <span class="clause-num">⑧</span
        ><span class="clause-text"
          >임금계산기간 및 지급일은 별도 협의에 따른다. 다만, 지급일이 토요일 또는 공휴일인 경우에는
          그 전날 또는 다음날에 지급한다.</span
        >
      </div>
    </div>

    <div class="article">
      <div class="article-title">제 6 조 【퇴직급여】</div>
      <div>
        '갑'은 '을'의 퇴직 시에 근로연수 1년에 대하여 평균임금 30일분의 퇴직금을 지급하며, 퇴직금은
        퇴사 시 일시금으로 지급되거나 퇴직연금으로 지급된다. 그 외에 퇴직금 지급에 관한 사항은
        노동관계법에 정하는 바에 의한다.
      </div>
    </div>

    <div class="article">
      <div class="article-title">제 7 조 【근로계약의 해지】</div>
      <div>다음 각 호에 해당하는 경우, '갑'은 '을'과의 근로계약을 해지할 수 있다.</div>
      <ul class="dismissal-list">
        <li>
          <span class="num">1.</span
          ><span
            >근무 성적 또는 능률이 불량한 자로서 취업이 부당하다고 인정되며, 개선의 가망이 없는
            경우</span
          >
        </li>
        <li>
          <span class="num">2.</span
          ><span>출근 상황이 불량하여 3회 이상 징계 처분을 받았거나 5일 이상 무단결근한 경우</span>
        </li>
        <li>
          <span class="num">3.</span
          ><span>신체 또는 정신상 병으로 직무를 감당할 수 없다고 인정되는 경우</span>
        </li>
        <li>
          <span class="num">4.</span
          ><span>고의 또는 중대한 사유로 회사에 손해를 끼쳤거나 명예를 손상한 경우</span>
        </li>
        <li>
          <span class="num">5.</span
          ><span
            >업무의 축소, 폐쇄 및 영업부진 등 경영상 이유에 의하여 감원이 필요하다고 인정되는
            경우</span
          >
        </li>
        <li>
          <span class="num">6.</span
          ><span>정기 또는 임시 건강진단 결과 취업 부적격자로 판정된 경우</span>
        </li>
        <li><span class="num">7.</span><span>취업 이후에 채용 결격 사유가 발견된 경우</span></li>
        <li>
          <span class="num">8.</span
          ><span>학력, 경력의 허위기재 등 부정한 방법으로 채용된 경우</span>
        </li>
        <li><span class="num">9.</span><span>형사상 유죄판결이 확정된 경우</span></li>
        <li><span class="num">10.</span><span>직장 내 질서를 문란하게 한 경우</span></li>
        <li>
          <span class="num">11.</span><span>'회사'의 승낙 없이 다른 직업에 종사하는 경우</span>
        </li>
        <li><span class="num">12.</span><span>기타 이에 준하는 부득이한 사유가 있는 경우</span></li>
      </ul>
    </div>

    <div class="article">
      <div class="article-title">제 8 조 【고지의무】</div>
      <div>
        상기 계약기간 만료 전 퇴사할 경우 '을'은 퇴사희망일 1개월 전에 관리자에게 사직서를
        제출하여야 하며, 업무 인수인계를 통하여 업무에 지장이 없도록 하여야 한다. 만약, 사전 통보
        없이 임의로 퇴사할 경우 '갑'은 이로 인한 관리적 손실에 대하여 '을'에게 손해배상을 청구할 수
        있다.
      </div>
    </div>

    <div class="article">
      <div class="article-title">제 9 조 【비밀유지의무】</div>
      <div>
        '을'은 근무 중 알게 된 '갑'의 내부 자료나 정보를 회사의 동의 없이 제3자에게 제공·누설하거나
        다른 목적으로 사용하지 않으며, 근로계약 해지 시에는 회사의 지적 자산 및 내부 자료를 즉시
        회사에 반납한다. 이와 관련하여 '갑'에게 금전적, 정신적 손해가 발생하였을 경우 전액 배상하고
        민·형사상의 책임을 진다.
      </div>
    </div>

    <div class="article">
      <div class="article-title">제 10 조 【보칙】</div>
      <div>
        이 계약서에서 정하지 아니한 사항은 「근로기준법」등 노동관계법령 또는 취업규칙에서 정하는
        바에 따른다.
      </div>
    </div>

    <div class="agreement-text">
      양 당사자 간 아무런 이의가 없기에 위 근로계약을 체결하며 상기사항을 성실히 준수하기 위하여 본
      계약서를 2부 작성, 서명날인한 후 각 1부씩 보관함.
    </div>

    <div class="sign-date-row">
      <input
        v-model="form.contractWrittenAt"
        type="date"
        class="val val-md sign-date-input"
        :class="{ 'val-error': isFieldEmpty('contractWrittenAt', true) }"
        :disabled="!canEditCompanyFields"
      />
    </div>

    <table class="sig-table">
      <tbody>
        <tr>
          <th rowspan="4">회 사<br />(갑)</th>
          <th class="label-col">대 표 자</th>
          <td>
            <input
              v-model="form.representativeName"
              type="text"
              class="val-table-left"
              :class="{ 'val-error': isFieldEmpty('representativeName', true) }"
              :disabled="!canEditCompanyFields"
            />
          </td>
        </tr>
        <tr>
          <th class="label-col">사업체명</th>
          <td>
            <input
              v-model="form.partyA"
              type="text"
              class="val-table-left"
              :class="{ 'val-error': isFieldEmpty('partyA', true) }"
              :disabled="!canEditCompanyFields"
            />
          </td>
        </tr>
        <tr>
          <th class="label-col">소 재 지</th>
          <td>
            <input
              v-model="form.companyAddress"
              type="text"
              class="val-table-left"
              :class="{ 'val-error': isFieldEmpty('companyAddress', true) }"
              :disabled="!canEditCompanyFields"
            />
          </td>
        </tr>
        <tr>
          <th class="label-col">대표자 서명</th>
          <td>
            <SignaturePad
              label=""
              v-model="form.representativeSignFileId"
              :editable="canEditCompanyFields"
              :warning="companySignatureMissing && canEditCompanyFields"
              compact
            />
          </td>
        </tr>
        <tr>
          <th rowspan="4">프리랜서<br />(을)</th>
          <th class="label-col">성 명</th>
          <td>
            <input
              v-model="form.partyB"
              type="text"
              class="val-table-left"
              :class="{ 'val-error': isFieldEmpty('partyB', false) }"
              :disabled="!canEditFreelancerFields"
            />
          </td>
        </tr>
        <tr>
          <th class="label-col">생년월일</th>
          <td>
            <input
              v-model="form.freelancerBirthDate"
              type="date"
              class="val-table-left"
              :class="{ 'val-error': isFieldEmpty('freelancerBirthDate', false) }"
              :disabled="!canEditFreelancerFields"
            />
          </td>
        </tr>
        <tr>
          <th class="label-col">주 소</th>
          <td>
            <input
              v-model="form.freelancerAddress"
              type="text"
              class="val-table-left"
              :class="{ 'val-error': isFieldEmpty('freelancerAddress', false) }"
              :disabled="!canEditFreelancerFields"
            />
          </td>
        </tr>
        <tr>
          <th class="label-col">
            프리랜서<br />
            서명
          </th>
          <td>
            <SignaturePad
              label=""
              v-model="form.contractSignFileId"
              :editable="canEditFreelancerFields"
              :warning="contractSignatureMissing && canEditFreelancerFields"
              compact
            />
          </td>
        </tr>
      </tbody>
    </table>

    <hr class="divider" />

    <div class="confirm-title">근로계약서 교부 확인서</div>
    <div class="confirm-text">
      본인은 근로기준법 제17조 제2항에 따라 본 계약서와 같은 내용의 근로계약서를 받았음을
      확인합니다.
    </div>
    <div class="sig-line-with-pad">
      <span>
        성명&#160;
        <input
          v-model="form.confirmSignerName"
          type="text"
          class="val val-md"
          :class="{ 'val-error': nameMismatch.confirm || isFieldEmpty('confirmSignerName', false) }"
          :disabled="!canEditFreelancerFields"
        />
        &#160;(서명)
      </span>
      <SignaturePad
        label=""
        v-model="form.confirmSignFileId"
        :editable="canEditFreelancerFields"
        :warning="!form.confirmSignFileId && canEditFreelancerFields"
        compact
      />
    </div>
    <p v-if="nameMismatch.confirm" class="error-text">
      성명이 위 서명테이블의 '{{ form.partyB }}'와 일치하지 않습니다.
    </p>

    <hr class="divider" />

    <div class="privacy-title">개인정보 수집·이용·제공 동의서</div>

    <div class="privacy-section">
      <div class="privacy-section-title">
        1. 본인은 회사가 아래와 같이 본인의 개인정보를 수집·이용하는 것에 동의합니다.
      </div>
      <div class="privacy-item">
        목적 : 채용전형, 근로관계에 근거하여 소득세법, 근로기준법, 사회보험법령, 기타 관련 법령에서
        부과하는 의무 이행, 인사이동, 상벌, 주요 근로조건 결정, 기타 인적자원관리, 민원처리,
        분쟁해결
      </div>
      <div class="privacy-item">
        수집항목 : 성명, 국적, 주소, 이메일, 연락처, 가족사항, 학력, 경력사항, 면허 및 자격증,
        회사의 법률상 의무 준수를 위해 필요한 정보, 급여지급관련사항(은행 및 계좌번호),
        복리후생지급관련사항 등
      </div>
      <div class="privacy-item">보유 이용 기간 : 개별 법령의 규정에 명시된 자료의 보존기간</div>
      <ConsentRadio v-model="consent.basic" :editable="canEditConsent" />
    </div>

    <div class="privacy-section">
      <div class="privacy-section-title">
        2. 본인은 회사가 위 목적으로 다음과 같은 본인의 고유식별정보를 수집·이용하는 것에
        동의합니다.
      </div>
      <div class="privacy-item">
        고유식별정보 : 주민등록번호, 운전면허번호, 외국인등록번호, 여권번호
      </div>
      <div class="privacy-item">보유 이용 기간 : 상기 개인정보를 보유하는 기간</div>
      <ConsentRadio v-model="consent.unique" :editable="canEditConsent" />
    </div>

    <div class="privacy-section">
      <div class="privacy-section-title">
        3. 본인은 회사가 위 목적으로 다음과 같은 본인의 민감정보를 수집·이용하는 것에 동의합니다.
      </div>
      <div class="privacy-item">민감정보 : 건강, 국가보훈대상, 범죄 경력</div>
      <div class="privacy-item">보유 이용 기간 : 상기 개인정보를 보유하는 기간</div>
      <ConsentRadio v-model="consent.sensitive" :editable="canEditConsent" />
    </div>

    <div class="privacy-section">
      <div class="privacy-section-title">
        4. 본인은 회사가 아래와 같이 개인정보를 제3자에게 제공하거나 위탁하는 것에 동의합니다.
      </div>
      <div class="privacy-item">
        제공받는 자 : 급여 아웃소싱, 단체 생명·의료비 보장보험 사업자, 복지카드 사업자, 퇴직연금
        사업자, 건강검진 시행기관, 여행사, 교육·훈련 기관, 고용노동부, 자문기관, 고객사, 기타
        위탁사업자
      </div>
      <div class="privacy-item">
        이용목적 : 급여산정 및 지급, 4대보험 처리, 급여 관련 세무처리, 교육, 보험가입, 고용노동부
        훈련비용 지원신청, 퇴직연금 가입, 복지카드 발급, 자문기관, 고객사, 위탁사업자 업무협조,
        건강검진, 숙박 예약 등 여행관련
      </div>
      <div class="privacy-item">
        제공할 개인정보 항목 : 개인식별정보, 급여, 교육훈련 내용 및 기간, 부양가족의 고유식별정보
      </div>
      <div class="privacy-item">보유 이용 기간 : 목적 달성 때까지</div>
      <ConsentRadio
        v-model="consent.thirdParty"
        :editable="canEditConsent"
        label-yes="동의"
        label-no="동의하지 않음"
      />
      <ConsentRadio
        v-model="consent.thirdPartyUnique"
        :editable="canEditConsent"
        label-yes="고유식별정보 제공에 동의"
        label-no="동의하지 않음"
      />
    </div>

    <div class="privacy-footer">
      위 1~4항의 개인정보의 제공에 관한 동의는 채용심사 및 근로계약의 체결을 위하여 필수적이므로, 위
      사항에 동의하셔야만 근로계약의 체결이 가능합니다. 이에 본인은 개인정보의 수집·제공·이용에 대한
      동의를 거부할 권리가 있다는 사실 및 동의의 거부 시 개인정보 부정확에 따른 채용, 인사이동,
      업무지연 등 불이익을 받을 수 있다는 사실을 숙지하였으며, 그 불이익에 대한 책임은 본인에게
      있음을 확인합니다.
    </div>

    <div class="sig-line-with-pad" style="margin-top: 20px">
      <span>
        성명&#160;
        <input
          v-model="form.privacySignerName"
          type="text"
          class="val val-md"
          :class="{ 'val-error': nameMismatch.privacy || isFieldEmpty('privacySignerName', false) }"
          :disabled="!canEditFreelancerFields"
        />
        &#160;(서명)
      </span>
      <SignaturePad
        label=""
        v-model="form.privacySignFileId"
        :editable="canEditFreelancerFields"
        :warning="!form.privacySignFileId && canEditFreelancerFields"
        compact
      />
    </div>
    <p v-if="nameMismatch.privacy" class="error-text">
      성명이 위 서명테이블의 '{{ form.partyB }}'와 일치하지 않습니다.
    </p>
  </div>
</template>

<script setup>
import { defineComponent, h, computed, watchEffect, ref, watch } from 'vue'
import SignaturePad from '@/features/contract/ui/SignaturePad.vue'

const props = defineProps({
  form: { type: Object, required: true },
  consent: { type: Object, required: true },
  canEditCompanyFields: { type: Boolean, default: false },
  canEditFreelancerFields: { type: Boolean, default: false },
  canEditConsent: { type: Boolean, default: false },
})

const WEEKDAYS = [
  { value: 'MON', label: '월' },
  { value: 'TUE', label: '화' },
  { value: 'WED', label: '수' },
  { value: 'THU', label: '목' },
  { value: 'FRI', label: '금' },
  { value: 'SAT', label: '토' },
  { value: 'SUN', label: '일' },
]

const todayStr = new Date().toISOString().slice(0, 10)
const calculatedTotal = computed(() => {
  return (
    Number(props.form.basePay || 0) +
    Number(props.form.overtimePay || 0) +
    Number(props.form.holidayPay || 0) +
    Number(props.form.mealAllowance || 0)
  )
})
watch(calculatedTotal, (value) => {
  props.form.monthlyWage = value
  props.form.totalWage = value
})
function formatAmount(value) {
  return Number(value || 0).toLocaleString()
}

function parseAmount(value) {
  return Number(String(value).replaceAll(',', '')) || 0
}

const AMOUNT_FIELDS = [
  'monthlyWage',
  'basePay',
  'overtimePay',
  'holidayPay',
  'mealAllowance',
  'totalWage',
]

function handleStartDateChange() {
  if (props.form.contractEndDate && props.form.contractEndDate < props.form.contractStartDate) {
    props.form.contractEndDate = props.form.contractStartDate
  }
}

const isOvernightShift = computed(() => {
  const start = props.form.workStartTime
  const end = props.form.workEndTime
  if (!start || !end) return false
  return end <= start
})

const nameMismatch = computed(() => {
  const base = (props.form.partyB || '').trim()
  return {
    confirm:
      !!base && !!props.form.confirmSignerName && props.form.confirmSignerName.trim() !== base,
    privacy:
      !!base && !!props.form.privacySignerName && props.form.privacySignerName.trim() !== base,
  }
})

const hasAnyMismatch = computed(() => nameMismatch.value.confirm || nameMismatch.value.privacy)

const COMPANY_REQUIRED_FIELDS = [
  'partyA',
  'representativeName',
  'companyAddress',
  'contractStartDate',
  'contractEndDate',
  'workLocation',
  'workDescription',
  'workStartTime',
  'workEndTime',

  'basePay',

  'contractWrittenAt',
]

const FREELANCER_REQUIRED_FIELDS = [
  'partyB',
  'freelancerBirthDate',
  'freelancerAddress',
  'confirmSignerName',
  'privacySignerName',
]

function isEmptyValue(val) {
  if (val === null || val === undefined) return true
  if (typeof val === 'string') return val.trim() === ''
  if (typeof val === 'number') return false
  return false
}

function isEmptyAmount(val) {
  if (val === null || val === undefined) return true
  return Number(val) <= 0
}

const basePayBasisMissing = computed(() => {
  return props.form.basePayBasisHour == null || props.form.basePayBasisHour <= 0
})

const missingCompanyFields = computed(() =>
  COMPANY_REQUIRED_FIELDS.filter((key) =>
    AMOUNT_FIELDS.includes(key) ? isEmptyAmount(props.form[key]) : isEmptyValue(props.form[key]),
  ),
)

const missingFreelancerFields = computed(() =>
  FREELANCER_REQUIRED_FIELDS.filter((key) => isEmptyValue(props.form[key])),
)

// workDaysArr 기준으로 변경
const workDaysMissing = computed(
  () => !props.form.workDaysArr || props.form.workDaysArr.length === 0,
)

const breakTimeMissing = computed(
  () => isEmptyValue(props.form.breakTimeStart) || isEmptyValue(props.form.breakTimeEnd),
)

const companySignatureMissing = computed(() => !props.form.representativeSignFileId)

const contractSignatureMissing = computed(() => !props.form.contractSignFileId)

const freelancerSignatureMissing = computed(() => {
  const f = props.form
  return !f.contractSignFileId || !f.confirmSignFileId || !f.privacySignFileId
})

const consentIncomplete = computed(() => {
  const c = props.consent
  return (
    c.basic !== true ||
    c.unique !== true ||
    c.sensitive !== true ||
    c.thirdParty !== true ||
    c.thirdPartyUnique !== true
  )
})

const hasMissingRequired = computed(() => {
  if (props.canEditCompanyFields) {
    return (
      missingCompanyFields.value.length > 0 ||
      workDaysMissing.value ||
      breakTimeMissing.value ||
      companySignatureMissing.value ||
      basePayBasisMissing.value
    )
  }
  if (props.canEditFreelancerFields) {
    return (
      missingFreelancerFields.value.length > 0 ||
      freelancerSignatureMissing.value ||
      consentIncomplete.value
    )
  }
  return false
})

const formTick = ref(0)
watchEffect(() => {
  JSON.stringify(props.form)
  formTick.value++
})

function isFieldEmpty(fieldKey, isCompanyField) {
  formTick.value // 반응성 트리거
  const editable = isCompanyField ? props.canEditCompanyFields : props.canEditFreelancerFields
  if (!editable) return false
  if (AMOUNT_FIELDS.includes(fieldKey)) {
    return isEmptyAmount(props.form[fieldKey])
  }
  return isEmptyValue(props.form[fieldKey])
}

defineExpose({ hasAnyMismatch, hasMissingRequired })

const ConsentRadio = defineComponent({
  props: {
    modelValue: { type: Boolean, default: null },
    editable: { type: Boolean, default: false },
    labelYes: { type: String, default: '동의' },
    labelNo: { type: String, default: '동의하지 않음' },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    return () => {
      const isAgreed = props.modelValue === true
      const showWarning = !isAgreed && props.editable

      return h('div', { class: ['consent-row', showWarning ? 'consent-row-warning' : ''] }, [
        h('label', { class: 'checkbox-label' }, [
          h('input', {
            type: 'radio',
            checked: isAgreed,
            disabled: !props.editable,
            onChange: () => emit('update:modelValue', true),
          }),
          ' ' + props.labelYes,
        ]),
        h('label', { class: 'checkbox-label' }, [
          h('input', {
            type: 'radio',
            checked: props.modelValue === false,
            disabled: !props.editable,
            onChange: () => emit('update:modelValue', false),
          }),
          ' ' + props.labelNo,
        ]),
        showWarning
          ? h('span', { class: 'consent-warning-text' }, '※ 미동의 시 계약 진행 불가')
          : null,
      ])
    }
  },
})
</script>

<style scoped>
.doc-page {
  font-family: 'NanumGothic', 'Noto Sans KR', sans-serif;
  font-size: 12px;
  color: #000;
  line-height: 1.6;
  background: white;
  padding: 20px 16px;
  width: 100%;
  box-sizing: border-box;
  overflow-wrap: break-word;
}

.doc-title-row {
  display: flex;
  align-items: center;
  margin-bottom: 24px;
}

.logo-area {
  font-size: 10px;
  color: #999;
  width: 40px;
}

.doc-title {
  flex: 1;
  text-align: center;
  font-size: 18px;
  font-weight: bold;
  letter-spacing: 4px;
}

.preamble {
  margin: 16px 0 20px;
  line-height: 2;
}

.val,
input.val {
  display: inline-block;
  border: none;
  border-bottom: 1px solid #000;
  border-radius: 0;
  background: transparent;
  text-align: center;
  font-size: 12px;
  font-family: inherit;
  padding: 0 3px;
  outline: none;
}

.val-lg {
  min-width: 140px;
}
.val-md {
  min-width: 90px;
}
.val-sm {
  min-width: 32px;
}

.val:focus {
  background: #fffbeb;
}
.val:disabled {
  background: transparent;
  color: #000;
}

.no-spinner::-webkit-outer-spin-button,
.no-spinner::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.no-spinner {
  -moz-appearance: textfield;
}

.val-error {
  border-color: transparent !important;
  box-shadow:
    0 0 0 3px rgba(251, 191, 36, 0.15),
    0 0 12px rgba(251, 191, 36, 0.12);
  transition: all 0.2s ease;
}

.cell-warning {
  box-shadow:
    inset 0 0 0 2px rgba(251, 191, 36, 0.4),
    0 0 12px rgba(251, 191, 36, 0.12);
  border-radius: 3px;
  transition: all 0.2s ease;
}

.error-text {
  font-size: 10.5px;
  color: #ef4444;
  text-align: right;
  margin: 4px 0 0;
}

.readonly-val {
  border-bottom: 1px solid #000;
  display: inline-block;
  min-width: 90px;
  text-align: center;
}

.article {
  margin-bottom: 16px;
}
.article-title {
  font-weight: bold;
  font-size: 13px;
  margin-bottom: 5px;
}

.clause {
  display: flex;
  gap: 4px;
  margin-bottom: 3px;
}
.clause-num {
  min-width: 18px;
}
.clause-text {
  flex: 1;
}

.fixed-clauses {
  margin-bottom: 14px;
}
.fixed-clauses .clause {
  margin-bottom: 4px;
}

.agreement-text {
  margin: 18px 0;
  line-height: 1.8;
}

.sig-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  margin: 8px 0 14px;
}

.sig-table th,
.sig-table td {
  /* border: 1px solid #000; */
  background: #fafafa;
  padding: 4px 2px;
  text-align: center;
  font-size: 10px;
  word-break: break-word;
  vertical-align: middle;
}

.sig-table th {
  background: #e0e0e0;
  font-weight: normal;
}

.work-table-vertical {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  margin: 8px 0 14px;
}

.work-table-vertical th,
.work-table-vertical td {
  /* border: 1px solid #000; */
  padding: 8px 10px;
  font-size: 11px;
  vertical-align: middle;
  background: #fafafa;
}

.work-table-vertical th {
  width: 90px;
  background: #e0e0e0;
  font-weight: normal;
  text-align: center;
}

.work-table-vertical td {
  text-align: left;
}

.break-time-cell-v {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  padding: 6px 8px;
}

.salary-card-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin: 8px 0 14px;
}
.salary-card {
  /* border: 1px solid #000; */
  border-radius: 4px;
  padding: 8px 10px;
  background: #fafafa;
}
.salary-card-total {
  background: #e0e0e0;
}

.salary-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
}

.salary-item-name {
  font-size: 11.5px;
  font-weight: 600;
  flex-shrink: 0;
}
.salary-amount-wrap {
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: 11px;
}

.val-amount {
  width: 90px;
  border: none;
  border-bottom: 1px solid #000;
  background: transparent;
  text-align: right;
  font-size: 11px;
  font-family: inherit;
  outline: none;
}

.val-amount:focus {
  background: #fffbeb;
}

.salary-card-sub {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
  padding-top: 6px;
  border-top: 1px dashed #ccc;
}

.salary-sub-label {
  font-size: 10px;
  color: #666;
  flex-shrink: 0;
}
.salary-note {
  font-size: 10px;
  color: #92400e;
  background: #fef3c7;
  padding: 1px 6px;
  border-radius: 3px;
}

.sig-table th {
  width: 60px;
  font-size: 10px;
}
.sig-table .label-col {
  width: 60px;
}

.workday-cell {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 10px;
  align-items: center;
  padding: 6px 8px;
}

.weekday-chip {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 11px;
  cursor: pointer;
  white-space: nowrap;
}

.weekday-chip input {
  width: 13px;
  height: 13px;
  flex-shrink: 0;
}

.val-table {
  width: 110px;
  border: none;
  border-bottom: 1px solid #000;
  background: transparent;
  text-align: center;
  font-size: 11px;
  font-family: inherit;
  outline: none;
}

.val-table:focus {
  background: #fffbeb;
}

.overnight-badge {
  display: inline-block;
  margin-left: 8px;
  padding: 1px 6px;
  background: #fef3c7;
  color: #92400e;
  font-size: 9.5px;
  border-radius: 3px;
  font-weight: 600;
}

.overnight-note {
  font-size: 10.5px;
  color: #92400e;
  margin: -8px 0 8px;
}
.break-time-label {
  font-size: 11px;
  color: #666;
  flex-shrink: 0;
}

.val-table-left {
  width: 100%;
  border: none;
  border-bottom: 1px solid #000;
  background: transparent;
  text-align: left;
  font-size: 11.5px;
  font-family: inherit;
  outline: none;
}

.val-table-left:focus {
  background: #fffbeb;
}

.dismissal-list {
  margin: 6px 0 0 10px;
}
.dismissal-list li {
  list-style: none;
  display: flex;
  gap: 6px;
  margin-bottom: 2px;
  font-size: 11.5px;
}
.dismissal-list .num {
  min-width: 26px;
}

.sign-date-row {
  text-align: center;
  margin: 20px 0 16px;
}
.sign-date-input {
  font-size: 14px;
  letter-spacing: 2px;
  min-width: 160px;
}

.divider {
  border: none;
  border-top: 1px dashed #999;
  margin: 28px 0;
}

.confirm-title {
  text-align: center;
  font-size: 15px;
  font-weight: bold;
  letter-spacing: 3px;
  text-decoration: underline;
  margin-bottom: 14px;
}

.confirm-text {
  line-height: 1.8;
  margin-bottom: 24px;
}
.sig-line {
  text-align: right;
  margin-top: 8px;
  font-size: 11.5px;
}

.sig-line-with-pad {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 8px;
  font-size: 11.5px;
}

.privacy-title {
  text-align: center;
  font-size: 16px;
  font-weight: bold;
  letter-spacing: 2px;
  margin-bottom: 20px;
}

.privacy-section {
  margin-bottom: 16px;
}
.privacy-section-title {
  font-weight: bold;
  margin-bottom: 5px;
  line-height: 1.6;
  font-size: 12px;
}
.privacy-item {
  margin-left: 6px;
  line-height: 1.7;
  margin-bottom: 2px;
  font-size: 11px;
  color: #333;
}
.privacy-item::before {
  content: '■ ';
}

.consent-row {
  text-align: right;
  margin-top: 6px;
  line-height: 1.9;
  font-size: 11.5px;
}

.consent-row-warning {
  background: rgba(255, 235, 186, 0.15);
  box-shadow:
    0 0 0 3px rgba(251, 191, 36, 0.15),
    0 0 12px rgba(251, 191, 36, 0.12);
  transition: all 0.2s ease;
  border-radius: 4px;
  padding: 4px 8px;
}

.consent-warning-text {
  display: block;
  font-size: 10px;
  color: #ef4444;
  font-weight: 600;
  text-align: right;
  margin-top: 2px;
}

.checkbox-label {
  margin-left: 14px;
  display: inline-flex;
  align-items: center;
  gap: 3px;
  cursor: pointer;
}

.checkbox-label input {
  width: 13px;
  height: 13px;
  cursor: pointer;
}

.privacy-footer {
  margin-top: 16px;
  line-height: 1.7;
  font-size: 10.5px;
  color: #333;
}

input:disabled,
.checkbox-label input:disabled {
  cursor: not-allowed;
}
</style>
