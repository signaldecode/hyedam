const SCRIPT_EL = document.currentScript;
const PLAN_URL = SCRIPT_EL?.dataset?.plan || "../../json/planData.json";
const DETAIL_URL = SCRIPT_EL?.dataset?.detail || "detail.html";

document.addEventListener("DOMContentLoaded", async () => {
  const res = await fetch(PLAN_URL);
  const plan = await res.json();

  // 통신사 판별
  // - 권장: 각 페이지의 <script src="...internet.js" data-provider="kt|lg|sk"> 로 명시
  // - 현재는 data-plan 파일명 기반으로 fallback 처리
  const PROVIDER = String(SCRIPT_EL?.dataset?.provider || "").toLowerCase();
  const inferredProvider = (() => {
    const u = String(PLAN_URL || "").toLowerCase();
    if (u.includes("plandal") || u.includes("plandatalg")) return "lg";
    if (u.includes("plandask") || u.includes("plandatask")) return "sk";
    // 기본값은 KT
    return "kt";
  })();
  const isKt = (PROVIDER || inferredProvider) === "kt";

  const state = {
    tabId: "internet_only",
    showMore: false,
    opts: { wifi: false, mobile_bundle: false },
  };

  // 탭 파라미터로 탭 지정 (예: ?tab=internet_tv)
  const urlTab = new URLSearchParams(window.location.search).get("tab");
  if (urlTab === "internet_sim") {
    // "인터넷+유심"은 별도 페이지로 이동
    window.location.replace(DETAIL_URL);
    return;
  }
  if (urlTab === "internet_only" || urlTab === "internet_tv") state.tabId = urlTab;

  const els = {
    tabs: document.querySelector("#prod .tab_wrap"),
    tabBtns: () => document.querySelectorAll("#prod .tab_btn"),
    title: document.querySelector("#prod .prod_wrap h2"),

    // 옵션 영역
    optsWrap: document.querySelector("#prod .prod_check_wrap"),

    // 첫 3개 카드
    cardsBase: document.querySelector("#prod .card_wrap:not(.card_wrap--more)"),

    // 더보기 카드 영역
    cardsMore: document.querySelector("#prod #cardMore"),

    wifi: document.querySelector('#prod .check_input#wifi'),
    mobile:
      document.querySelector('#prod .check_input#mobile_bundle') ||
      document.querySelector('#prod .check_input#phone'),

    moreBtn: document.querySelector("#prod .more_btn_wrap"),
  };

  const fmtWon = (n) => `${Number(n).toLocaleString("ko-KR")}원`;
  const fmtMonthly = (n) => `월 ${Number(n).toLocaleString("ko-KR")}원`;

  const syncOptionsFromUI = () => {
    state.opts.wifi = !!els.wifi?.checked;
    state.opts.mobile_bundle = !!els.mobile?.checked;
  };

  // 옵션 표시/활성화 규칙
  // - KT: 옵션 영역은 인터넷+TV 탭에서만 노출, WiFi는 필수(체크 + 비활성)
  // - LG/SK: 옵션 영역은 전 탭에서 미노출(향후 정책 변경 가능)
  // - 휴대폰 결합은 우선 미노출(추후 정책 변경 가능)
  const syncOptionAvailability = () => {
    const isTvTab = state.tabId === "internet_tv";

    // LG/SK: 옵션 영역 자체를 숨김
    if (!isKt) {
      if (els.optsWrap) els.optsWrap.style.display = "none";

      if (els.wifi) {
        els.wifi.disabled = false;
        els.wifi.checked = false;
      }
      if (els.mobile) {
        els.mobile.disabled = true;
        els.mobile.checked = false;
        const mobileItem = els.mobile.closest(".check_item");
        if (mobileItem) mobileItem.style.display = "none";
      }

      state.opts.wifi = false;
      state.opts.mobile_bundle = false;
      return;
    }

    // KT: 인터넷+TV 탭에서만 옵션 영역 노출
    if (els.optsWrap) els.optsWrap.style.display = isTvTab ? "" : "none";

    if (els.wifi) {
      const wifiItem = els.wifi.closest(".check_item");
      if (isTvTab) {
        els.wifi.checked = true;
        els.wifi.disabled = true;
        state.opts.wifi = true;
        if (wifiItem) wifiItem.classList.add("is-disabled");
      } else {
        els.wifi.disabled = false;
        els.wifi.checked = false;
        state.opts.wifi = false;
        if (wifiItem) wifiItem.classList.remove("is-disabled");
      }
    }

    if (els.mobile) {
      els.mobile.disabled = true;
      els.mobile.checked = false;
      state.opts.mobile_bundle = false;

      // TODO: KT에서도 휴대폰 결합은 추후 정책 확정 후 재노출/활성화
      const mobileItem = els.mobile.closest(".check_item");
      if (mobileItem) mobileItem.style.display = "none";
    }
  };

  const optionKey = () => {
    const order = plan.rules?.optionKeyOrder || ["wifi", "mobile_bundle"];
    const joiner = plan.rules?.optionKeyJoiner || "+";
    return order.filter((k) => state.opts[k]).join(joiner);
  };

  const compute = (card) => {
    const key = optionKey();
    const adj = key ? card.optionAdjustments?.[key] : null;

    const finalMonthly = card.base.finalMonthly + (adj?.deltaMonthly || 0);

    const breakdown = { ...(card.base.breakdown || {}) };
    const deltaB = adj?.deltaBreakdown || {};
    for (const k in deltaB) breakdown[k] = (breakdown[k] || 0) + deltaB[k];

    const totalDiscount = Object.entries(breakdown)
      .filter(([k]) => k.endsWith("Discount") && k !== "totalDiscount")
      .reduce((sum, [, v]) => sum + Number(v || 0), 0);

    breakdown.totalDiscount = totalDiscount;

    return { finalMonthly, breakdown, badge: adj?.badgeOverride ?? card.badge };
  };

  const labelMap = {
    basePrice: "기본요금",
    contractDiscount: "약정할인",
    tvDiscount: "TV 결합 할인",
    bundleDiscount: "휴대폰 결합 할인",
    baseDiscount: "결합 할인",
    wifiFee: "WiFi",
    totalDiscount: "총 할인금액",
  };

  const orderKeys = [
    "basePrice",
    "contractDiscount",
    "tvDiscount",
    "bundleDiscount",
    "baseDiscount",
    // "wifiFee",
    "totalDiscount",
  ];

  const setMoreBtnText = (text) => {
    if (!els.moreBtn) return;

    const textNode = Array.from(els.moreBtn.childNodes).find(
      (n) => n.nodeType === 3 && n.textContent.trim().length > 0
    );

    if (textNode) textNode.textContent = `${text} `;
  };

  const renderMoreBtn = (totalCards) => {
    if (!els.moreBtn) return;

    const isTvTab = state.tabId === "internet_tv";
    const shouldShow = isTvTab && totalCards > 3;

    els.moreBtn.style.display = shouldShow ? "" : "none";
    els.moreBtn.classList.toggle("is-open", state.showMore);

    if (!shouldShow) return;

    setMoreBtnText(state.showMore ? "인터넷+TV 상품 접기" : "인터넷+TV 상품 더보기");
  };

  const renderCard = (tabTitle, card, isTvTab) => {
    const { finalMonthly, breakdown, badge } = compute(card);
    const ribbonHtml = card.ribbon
      ? `<span class="plan_ribbon">${typeof card.ribbon === "string" ? card.ribbon : "혜담<br/>추천"}</span>`
      : "";

    const rows = orderKeys
      .filter((k) => breakdown[k] !== undefined)
      .map((k) => {
        const isTotal = k === "totalDiscount";
        return `
          <div class="plan_row ${isTotal ? "plan_row--total" : ""}">
            <dt>${labelMap[k] || k}</dt>
            <dd>${fmtWon(breakdown[k])}</dd>
          </div>
        `;
      })
      .join("");

    return `
      <article class="plan_card" data-card-id="${card.id}">
        ${
          badge
            ? `<span class="plan_badge">${String(badge).replace("\n", "<br/>")}</span>`
            : ""
        }
        ${ribbonHtml}
        <img src="../../images/icons/sub_monitor.svg" alt="${tabTitle}" />
        <h3 class="plan_title">${card.name}</h3>

        <div class="plan_price">
          <span class="plan_price_label">최종 월 요금</span>
          <strong class="plan_price_value">${fmtMonthly(finalMonthly)}</strong>
        </div>

        <hr class="plan_divider" />

        <dl class="plan_spec">${rows}</dl>

        

        <div class="plan_actions">
          ${isTvTab ? `<p class="plan_note">※ 셋탑박스 임대료 포함</p>` : ""}
          <a class="plan_btn" href="../form.html">${card.cta?.label || "상담문의"}</a>
        </div>
      </article>
    `;
  };

  const renderCards = () => {
    const tab = plan.data?.[state.tabId];
    if (!tab) return;

    // 탭에 따라 옵션 UI/상태 동기화
    syncOptionAvailability();

    if (els.title) els.title.textContent = tab.title;

    const isTvTab = state.tabId === "internet_tv";
    const total = tab.cards.length;

    // 기본 3개는 항상 상단 배치
    const baseCards = isTvTab ? tab.cards.slice(0, 3) : tab.cards;
    const baseHtml = baseCards.map((card) => renderCard(tab.title, card, isTvTab)).join("");
    if (els.cardsBase) els.cardsBase.innerHTML = baseHtml;

    // 추가 9개는 더보기 버튼 아래 배치
    const moreCards = isTvTab ? tab.cards.slice(3, 12) : [];
    const moreHtml =
      isTvTab && state.showMore
        ? moreCards.map((card) => renderCard(tab.title, card, isTvTab)).join("")
        : "";
    if (els.cardsMore) els.cardsMore.innerHTML = moreHtml;

    renderMoreBtn(total);
  };

  // 상단 탭
  els.tabs?.addEventListener("click", (e) => {
    const btn = e.target.closest(".tab_btn");
    if (!btn) return;

    if (btn.dataset.tab === "internet_sim") {
      window.location.href = DETAIL_URL;
      return;
    }

    state.tabId = btn.dataset.tab;
    state.showMore = false; // 더보기 버튼 우선 false로 초기화

    els.tabBtns().forEach((b) => b.classList.toggle("is-active", b === btn));

    // URL도 탭 상태와 동기화 (?tab=...)
    const params = new URLSearchParams(window.location.search);
    params.set("tab", state.tabId);
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}?${params.toString()}`
    );

    renderCards();
  });

  // 옵션 변경
  document.querySelector("#prod")?.addEventListener("change", (e) => {
    if (!e.target.classList.contains("check_input")) return;
    if (state.tabId !== "internet_tv") return;

    syncOptionsFromUI();
    renderCards();
  });

  // 더보기 클릭
  els.moreBtn?.addEventListener("click", () => {
    if (state.tabId !== "internet_tv") return;
    state.showMore = !state.showMore;
    renderCards();
  });

  // 초기
  els.tabBtns().forEach((b) =>
    b.classList.toggle("is-active", b.dataset.tab === state.tabId)
  );
  renderCards();
});