document.addEventListener("DOMContentLoaded", function () {
  const toastEl = document.getElementById("hyedamToast");
  const toastMsgEl = document.getElementById("hyedamToastMsg");
  let toastTimer = null;

  // --------- 입력 정규화(공통) ----------
  function sanitizeName(value) {
    // 앞뒤 공백 정리 + 20자 제한
    return String(value ?? "").trim().slice(0, 20);
  }

  function sanitizePhone(value) {
    // 숫자만 남기고(한글/특수문자/공백 포함 전부 제거) 11자리로 제한
    const digits = String(value ?? "").replace(/\D/g, "");
    return digits.slice(0, 11);
  }

  function bindSanitizers(form) {
    const nameInput = form.querySelector('[name="name"]');
    const phoneInput = form.querySelector('[name="phonenumber"]');

    if (nameInput) {
      // HTML의 maxlength가 없더라도 강제로 20자 제한
      nameInput.addEventListener("input", () => {
        const v = sanitizeName(nameInput.value);
        if (nameInput.value !== v) nameInput.value = v;
      });
      nameInput.addEventListener("blur", () => {
        nameInput.value = sanitizeName(nameInput.value);
      });
    }

    if (phoneInput) {
      phoneInput.addEventListener("input", () => {
        const v = sanitizePhone(phoneInput.value);
        if (phoneInput.value !== v) phoneInput.value = v;
      });
      phoneInput.addEventListener("blur", () => {
        phoneInput.value = sanitizePhone(phoneInput.value);
      });
    }
  }

  function showToast(message) {
    if (!toastEl || !toastMsgEl) {
      alert(message);
      return;
    }

    toastMsgEl.textContent = message;
    toastEl.classList.add("is-open");

    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastEl.classList.remove("is-open");
    }, 2000);
  }

  // --------- 비밀링크 팝업 ----------
  function showSuccessPopup() {
    // 중복 생성 방지
    const existing = document.querySelector(".form_success_wrap");
    if (existing) existing.remove();

    const html = `
      <div class="form_success_wrap" role="dialog" aria-modal="true">
        <div class="form_success">
          <div class="txt">
            <em>
              <span></span>
              비밀 지원금 신청이 정상 접수되었습니다! <br>
            </em>
            <b>혜담에서 신청 내용을 확인 후 상담 안내를 도와드릴 예정이에요.<br>(평균 1영업일 이내)</b>
            <p>상담 전, 혜담이 궁금하시다면 아래 채널을 참고해 주세요.</p>
            <div class="btn_wrap">
              <a class="youtube" href="https://youtube.com/channel/UC9dqDtma7yYg1cms_FOq4IQ?si=AkpMHf3K2HBrkSZ2" target="_blank">
                <img src="images/quick_icon03.svg" alt="">
                유튜브 구경 하러 가기
              </a>
              <a class="kakao" href="http://pf.kakao.com/_ZHxkxgn" target="_blank">
                <img src="images/quick_icon01.svg" alt="">
                카톡 상담 하러 가기
              </a>
              <button aria-label="팝업 닫기" type="button" class="popup_close">닫기</button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML("beforeend", html.trim());

    const wrap = document.querySelector(".form_success_wrap");
    const closeBtn = wrap?.querySelector(".popup_close");

    const close = () => {
      if (wrap) wrap.remove();
      document.body.style.overflow = prevOverflow;
    };

    // 닫기 버튼
    closeBtn?.addEventListener("click", (e) => {
      e.preventDefault();
      close();
    });
  }

  function bindAllForms(root = document) {
    const forms = Array.from(
      root.querySelectorAll("form[data-hyedam-form], #registrationForm, #fixRegistrationForm")
    ).filter(Boolean);

    if (!forms.length) return;

    forms.forEach((form) => {
      if (form.getAttribute("data-hyedam-bound") === "1") return;
      bindForm(form);
      form.setAttribute("data-hyedam-bound", "1");
    });
  }

  // 외부에서 동적 폼(바텀시트 등) 주입 후 재바인딩 할 수 있도록 노출
  window.hyedamBindForms = bindAllForms;

  bindAllForms();

  function bindForm(form) {
    // 입력값 정리(한글/특수문자 제거, 길이 제한 등)
    bindSanitizers(form);

    const formType =
      form.getAttribute("data-hyedam-form") ||
      (form.querySelector('select[name="concern"], select[name="contact_method"]')
        ? "consult"
        : "estimate");

    // 각 폼 내부 버튼을 우선 찾고, 없으면 id로 fallback
    const submitBtn =
      form.querySelector('button[type="submit"]') ||
      form.querySelector("#submitBtn") ||
      form.querySelector("#fixSubmitBtn");
    if (!submitBtn) return;
    // 처리중 타이핑 효과 중복 클릭 방지

    const btnText =
      submitBtn.querySelector(".btn-text") ||
      submitBtn.querySelector("span:not(.btn-loading)") ||
      submitBtn;
    const btnLoading = submitBtn.querySelector(".btn-loading");
    const initialBtnLabel = (btnText?.textContent || "").trim();
    const initialLoadingLabel = (btnLoading?.textContent || "처리중...").trim();

    let loadingTypingTimer = null;
    function startLoadingTyping() {
      if (!btnLoading) return;
      stopLoadingTyping();

      const text = initialLoadingLabel || "처리중...";
      let i = 0;
      btnLoading.textContent = "";
      const stepMs = 220;
      const endPauseMs = 700;

      const tick = () => {
        i = i + 1;
        if (i > text.length) i = 0;
        btnLoading.textContent = text.slice(0, i);

        const delay = i === text.length ? endPauseMs : stepMs;
        loadingTypingTimer = setTimeout(tick, delay);
      };

      loadingTypingTimer = setTimeout(tick, stepMs);
    }

    function stopLoadingTyping() {
      if (loadingTypingTimer) {
        clearTimeout(loadingTypingTimer);
        loadingTypingTimer = null;
      }
      if (btnLoading) btnLoading.textContent = initialLoadingLabel || "처리중...";
    }

    form.addEventListener("submit", async function (e) {
      e.preventDefault();

      const validation = validate(form, formType);
      if (!validation.ok) {
        showToast(validation.message || "입력값을 확인해주세요.");
        return;
      }

      setLoadingState(true);

      try {
        const data = collectPayload(form, formType);
        const result = await submitToGoogleSheets(data);
        if (!result || result.success !== true) throw new Error("Submit failed");
        // ✅ 전환 이벤트: 성공했을 때만 1회 발사
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({
          event: "generate_lead_event02",
          form_type: data.form_type || "estimate",   // 선택: 구분용
          page_path: data.page_path || location.pathname
        });
        showSuccessPopup();
        form.reset();
      } catch (error) {
        console.error("제출 오류:", error);
        showToast("전송에 실패했습니다. 잠시 후 다시 시도해주세요.");
      } finally {
        setLoadingState(false);
      }
    });

    function setLoadingState(isLoading) {
      submitBtn.disabled = isLoading;
      // 로딩 중엔 버튼 문구는 숨기고 "처리중..."만 보이게
      if (btnText && btnText !== submitBtn) {
        btnText.style.display = isLoading ? "none" : "inline";
      }
      if (btnLoading) btnLoading.style.display = isLoading ? "inline" : "none";

      if (isLoading) startLoadingTyping();
      else stopLoadingTyping();
    }

    function setBtnText(text) {
      if (!btnText) return;
      if (btnText === submitBtn) submitBtn.textContent = text;
      else btnText.textContent = text;
    }

    function flashBtn(text) {
      const prev = initialBtnLabel || btnText?.textContent || "";
      setBtnText(text);
      setTimeout(() => setBtnText(prev || "신청하기"), 1500);
    }
  }

  function validate(form, formType) {
    // 공통 필수: name / phonenumber
    const nameInput = form.querySelector('[name="name"]');
    const phoneInput = form.querySelector('[name="phonenumber"]');

    const name = sanitizeName(nameInput?.value);
    const phone = sanitizePhone(phoneInput?.value);

    // 입력값을 폼에 그대로 반영
    if (nameInput && nameInput.value !== name) nameInput.value = name;
    if (phoneInput && phoneInput.value !== phone) phoneInput.value = phone;

    const consent = form.querySelector('input[type="checkbox"][name="consent"]')?.checked;
    //정규식 유효성 검사
    // 이름: 20자 이하(공백 X)
    if (!name) return { ok: false, message: "이름을 입력해주세요." };
    if (name.length > 20) return { ok: false, message: "이름은 20자 이하로 입력해주세요." };

    // 연락처: 숫자만, 9~11자리, 010일땐 11자리
    if (!phone) return { ok: false, message: "연락처를 입력해주세요." };
    if (phone.startsWith("010")&&phone.length < 11)
      return { ok: false, message: "올바른 연락처를 입력해주세요." };
    if (phone.length < 9 || phone.length > 11)
      return { ok: false, message: "올바른 연락처를 입력해주세요." };

    if (!consent) return { ok: false, message: "개인정보 수집/이용에 동의해주세요." };

    // 상담 폼만 추가 필수 2개
    if (formType === "consult") {
      const concern = form.querySelector('[name="concern"]')?.value?.trim();
      //const contactMethod = form.querySelector('[name="contact_method"]')?.value?.trim();
      if (!concern) return { ok: false, message: "고민 항목을 선택해주세요." };
      //if (!contactMethod) return { ok: false, message: "연락 방법을 선택해주세요." };
    }

    return { ok: true, message: "" };
  }

  function collectPayload(form, formType) {
    const nowIso = new Date().toISOString();
    const fd = new FormData(form);

    const payload = {
      timestamp: nowIso,
      form_type: formType, // 상담 | 플로팅
      page_url: window.location.href,
      page_path: window.location.pathname,
      page_title: document.title || "",
    };

    // name 있는 필드 전부 수집(폼: 4개, 플로팅: 2개)
    for (const [k, v] of fd.entries()) payload[k] = String(v ?? "");

    // 체크박스는 Y/N으로 정규화 데이터 넘기진 않음, 프론트에서 N 이면 넘기지 않음
    form.querySelectorAll('input[type="checkbox"][name]').forEach((cb) => {
      payload[cb.name] = cb.checked ? "Y" : "N";
    });

    // 프로젝트 공통 키
    if (payload.consent !== undefined && payload.agree === undefined) {
      payload.agree = payload.consent === "Y" ? "Y" : "N";
    }

    // 폼 타입별로 필요없는 값은 제거
    if (formType === "estimate") {
      delete payload.concern;
      delete payload.contact_method;
    }

    payload.name = String(payload.name || "");
    payload.phonenumber = String(payload.phonenumber || "");

    return payload;
  }
});
