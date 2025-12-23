document.addEventListener("DOMContentLoaded", function () {
  const toastEl = document.getElementById("hyedamToast");
  const toastMsgEl = document.getElementById("hyedamToastMsg");
  let toastTimer = null;

  function showToast(message) {
    // 토스트 DOM이 없으면 최소한 alert로라도 안내
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

  const forms = Array.from(
    document.querySelectorAll("form[data-hyedam-form], #registrationForm, #fixRegistrationForm")
  ).filter(Boolean);

  if (!forms.length) return;

  forms.forEach((form) => bindForm(form));

  function bindForm(form) {
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

    const btnText =
      submitBtn.querySelector(".btn-text") ||
      submitBtn.querySelector("span:not(.btn-loading)") ||
      submitBtn;
    const btnLoading = submitBtn.querySelector(".btn-loading");
    const initialBtnLabel = (btnText?.textContent || "").trim();

    form.addEventListener("submit", async function (e) {
      e.preventDefault();

      if (!validate(form, formType)) {
        showToast(
          formType === "consult"
            ? "모든 항목을 입력 혹은 선택해주세요."
            : "이름/연락처 입력 및 동의 체크를 확인해주세요."
        );
        return;
      }

      setLoadingState(true);

      try {
        const data = collectPayload(form, formType);
        const result = await submitToGoogleSheets(data);
        if (!result || result.success !== true) throw new Error("Submit failed");

        showToast("신청이 완료되었습니다.");
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
    // 공통 필수: name / phonenumber / consent
    const name = form.querySelector('[name="name"]')?.value?.trim();
    const phone = form.querySelector('[name="phonenumber"]')?.value?.trim();
    const consent = form.querySelector('input[type="checkbox"][name="consent"]')?.checked;

    if (!name || !phone || !consent) return false;

    // 상담 폼만 추가 필수 2개
    if (formType === "consult") {
      const concern = form.querySelector('[name="concern"]')?.value?.trim();
      const contactMethod = form.querySelector('[name="contact_method"]')?.value?.trim();
      if (!concern || !contactMethod) return false;
    }

    return true;
  }

  function collectPayload(form, formType) {
    const nowIso = new Date().toISOString();
    const fd = new FormData(form);

    const payload = {
      timestamp: nowIso,
      form_type: formType, // consult | estimate
      page_url: window.location.href,
      page_path: window.location.pathname,
      page_title: document.title || "",
    };

    // name 있는 필드 전부 수집(consult: 4개, estimate: 2개)
    for (const [k, v] of fd.entries()) payload[k] = String(v ?? "");

    // 체크박스는 Y/N으로 정규화
    form.querySelectorAll('input[type="checkbox"][name]').forEach((cb) => {
      payload[cb.name] = cb.checked ? "Y" : "N";
    });

    // 프로젝트 공통 키
    if (payload.consent !== undefined && payload.agree === undefined) {
      payload.agree = payload.consent === "Y" ? "Y" : "N";
    }

    // 폼 타입별로 필요없는 값은 제거(요청대로)
    if (formType === "estimate") {
      delete payload.concern;
      delete payload.contact_method;
    }

    // 보장
    payload.name = String(payload.name || "");
    payload.phonenumber = String(payload.phonenumber || "");

    return payload;
  }
});
