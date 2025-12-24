//공용 디자인 플로팅 UI
// (하단 플로팅 / 퀵메뉴 / 모바일 퀵 / 토스트 메세지)를 모든 페이지 공통
(function () {
  // 주입 위치: main이 있으면 main 끝 / 없으면 wrap / 없으면 body 
  // 공통 디자인 추가 되지 않으면 html 구조 확인 후 html 구조 수정 필요
  const section =
    document.querySelector("main") ||
    document.getElementById("wrap") ||
    document.body;

  function float(selector, html, target) {
    if (document.querySelector(selector)) return;
    target.insertAdjacentHTML("beforeend", html.trim());
  }

  //하단 플로팅
  const FIX_FORM_HTML = `
    <div class="fix_form_wrap">
      <div class="fix_form">
        <div class="inner">
          <div class="txt">
            <p>내가 받을 수 있는 최대 혜택은 얼마나 될까?</p>
            <em>지금 바로 맞춤 요금 상담 받아보세요!</em>
          </div>
          <form
            id="fixRegistrationForm"
            class="registration-form"
            data-hyedam-form="estimate"
            novalidate
          >
            <div class="fix_item">
              <input
                type="text"
                placeholder="이름"
                id="fix_name"
                name="name"
                required
              />
              <input
                type="tel"
                placeholder="연락처"
                id="fix_phonenumber"
                name="phonenumber"
                required
              />

              <div class="btn_wrap">
                <button
                  type="submit"
                  id="fixSubmitBtn"
                  class="btn-submit"
                  aria-label="빠른 견적 신청하기"
                >
                  <span class="btn-text">빠른 견적 신청!</span>
                  <span class="btn-loading" style="display: none">처리중...</span>
                </button>

                <div class="agreement">
                  <label>
                    <input
                      type="checkbox"
                      id="fix_consent"
                      name="consent"
                      required
                    />
                    <span>개인정보 수집 및 활용 동의</span>
                  </label>
                  <a href="#" target="_blank">보기</a>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;

  //퀵메뉴
  const QUICK_MENU_HTML = `
    <div class="quick_menu">
      <button
        class="mob_qiuck"
        type="button"
        aria-label="퀵 메뉴 열기"
      ></button>
      <ul>
        <li>
          <a href="http://pf.kakao.com/_ZHxkxgn">
            <figure>
              <img src="images/quick_icon01.svg" alt="카카오톡 아이콘" />
              <figcaption>카카오톡 아이콘</figcaption>
            </figure>
            <em>카톡문의</em>
          </a>
        </li>
        <li>
          <!-- PC에선 form 페이지로 이동 -->
          <a href="pages/form.html">
            <figure>
              <img
                src="images/quick_icon02.svg"
                alt="빠르게 견적 받기 아이콘"
              />
              <figcaption>빠르게 견적 받기 아이콘</figcaption>
            </figure>
            <em>빠르게<br />견적받기</em>
          </a>
        </li>
        <li>
          <a href="https://youtube.com/channel/UC9dqDtma7yYg1cms_FOq4IQ?si=AkpMHf3K2HBrkSZ2">
            <figure>
              <img src="images/quick_icon03.svg" alt="유튜브 아이콘" />
              <figcaption>유튜브 아이콘</figcaption>
            </figure>
            <em>유튜브</em>
          </a>
        </li>
      </ul>
      <button class="scroll_top" type="button" aria-label="맨 위로 이동">
        TOP<span></span>↑
      </button>
    </div>
  `;

  //모바일 퀵메뉴
  const MOB_QUICK_HTML = `
    <div class="mob_quick">
      <ul>
        <li>
          <a href="http://pf.kakao.com/_ZHxkxgn">
            <figure>
              <img src="images/quick_icon01.svg" alt="카카오톡 아이콘" />
              <figcaption>카카오톡 아이콘</figcaption>
            </figure>
            <em>카톡문의</em>
          </a>
        </li>
        <li>
          <a href="#" data-hyedam-action="open-estimate-sheet">
            <figure>
              <img
                src="images/quick_icon02.svg"
                alt="빠르게 견적 받기 아이콘"
              />
              <figcaption>빠르게 견적 받기 아이콘</figcaption>
            </figure>
            <em>빠르게<br />견적받기</em>
          </a>
        </li>
        <li>
          <a href="https://youtube.com/channel/UC9dqDtma7yYg1cms_FOq4IQ?si=AkpMHf3K2HBrkSZ2">
            <figure>
              <img src="images/quick_icon03.svg" alt="유튜브 아이콘" />
              <figcaption>유튜브 아이콘</figcaption>
            </figure>
            <em>유튜브</em>
          </a>
        </li>
      </ul>
      <button
        class="quick_open"
        type="button"
        aria-label="모바일 퀵 메뉴 열기"
      ></button>
    </div>
  `;

  //토스트 메세지 신청 완료 팝업은 form-handler.js 에서 
  const TOAST_HTML = `
    <div class="hyedam-toast" id="hyedamToast" aria-live="polite" role="status">
      <p class="hyedam-toast-msg" id="hyedamToastMsg"></p>
    </div>
  `;

  // 주입(중복 방지)
  float(".fix_form_wrap", FIX_FORM_HTML, section);
  float(".quick_menu", QUICK_MENU_HTML, section);
  float(".mob_quick", MOB_QUICK_HTML, section);

  if (!document.getElementById("hyedamToast")) {
    document.body.insertAdjacentHTML("beforeend", TOAST_HTML.trim());
  }

  // ===== 바텀시트(빠른 견적) =====
  const SHEET_ID = "hyedamEstimateSheet";

  const SHEET_HTML = `
    <div class="hyedam-sheet" id="${SHEET_ID}" aria-hidden="true">
      <div class="hyedam-sheet-backdrop" data-hyedam-action="close-estimate-sheet"></div>
      <div class="hyedam-sheet-panel" role="dialog" aria-modal="true" aria-label="빠른 견적 신청">
        <button type="button" class="hyedam-sheet-close" data-hyedam-action="close-estimate-sheet" aria-label="닫기"></button>
        <div class="hyedam-sheet-head">
          <p>내가 받을 수 있는 최대 혜택은 얼마나 될까?</p>
          <em>지금 바로 맞춤 요금 상담 받아보세요!</em>
        </div>

        <form class="hyedam-sheet-form" data-hyedam-form="estimate" novalidate>
          <div class="hyedam-sheet-fields">
            <input type="text" name="name" placeholder="이름" required />
            <input type="tel" name="phonenumber" placeholder="연락처" required />
          </div>

          <div class="hyedam-sheet-agree">
            <label>
              <input type="checkbox" name="consent" required />
              <span>개인정보 수집 및 활용 동의</span>
            </label>
            <a href="#" target="_blank" rel="noopener">보기</a>
          </div>

          <button type="submit" class="hyedam-sheet-submit" aria-label="빠른 견적 신청하기">
            <span class="btn-text">빠른 견적 신청!</span>
            <span class="btn-loading" style="display:none">처리중...</span>
          </button>
        </form>
      </div>
    </div>
  `;

  if (!document.getElementById(SHEET_ID)) {
    document.body.insertAdjacentHTML("beforeend", SHEET_HTML.trim());
    if (typeof window.hyedamBindForms === "function") {
      window.hyedamBindForms(document.getElementById(SHEET_ID));
    }
  }

  function openSheet() {
    const sheet = document.getElementById(SHEET_ID);
    if (!sheet) return;
    sheet.classList.add("is-open");
    sheet.setAttribute("aria-hidden", "false");
  }

  function closeSheet() {
    const sheet = document.getElementById(SHEET_ID);
    if (!sheet) return;
    sheet.classList.remove("is-open");
    sheet.setAttribute("aria-hidden", "true");
    // 스크롤 복구
    const prev = sheet.dataset.prevOverflow ?? "";
    document.body.style.overflow = prev;
  }

  document.addEventListener("click", function (e) {
    const opener = e.target.closest(
      '.mob_quick [data-hyedam-action="open-estimate-sheet"]'
    );
    if (opener) {
      e.preventDefault();
      openSheet();
      return;
    }

    const closer = e.target.closest('[data-hyedam-action="close-estimate-sheet"]');
    if (closer) {
      e.preventDefault();
      closeSheet();
    }
  });
})();
