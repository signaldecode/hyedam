document.addEventListener("DOMContentLoaded", async () => {
  const res = await fetch("../../json/planData.json");
  const plan = await res.json();
  

  const state = {
    tabId: "internet_only",
    showMore: false,
    opts: { wifi: false, mobile_bundle: false },
  };

  const els = {
    tabs: document.querySelector("#prod .tab_wrap"),
    tabBtns: () => document.querySelectorAll("#prod .tab_btn"),
    title: document.querySelector("#prod .prod_wrap h2"),

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
    wifiFee: "WiFi",
    totalDiscount: "총 할인금액",
  };

  const orderKeys = [
    "basePrice",
    "contractDiscount",
    "tvDiscount",
    "bundleDiscount",
    "wifiFee",
    "totalDiscount",
  ];

  const setMoreBtnText = (text) => {
    if (!els.moreBtn) return;

    // 텍스트 노드만 찾아서 교체
    const textNode = Array.from(els.moreBtn.childNodes).find(
      (n) => n.nodeType === 3 && n.textContent.trim().length > 0
    );
    if (textNode) textNode.textContent = text + " ";
  };

  const renderMoreBtn = (totalCards) => {
    if (!els.moreBtn) return;

    const isTvTab = state.tabId === "internet_tv";
    const shouldShow = isTvTab && totalCards > 3;

    els.moreBtn.style.display = shouldShow ? "" : "none";
    els.moreBtn.classList.toggle("is-open", state.showMore);

    if (shouldShow) {
      setMoreBtnText(state.showMore ? "인터넷+TV 상품 접기" : "인터넷+TV 상품 더보기");
    }
  };

  const renderCard = (tabTitle, card, isTvTab) => {
    const { finalMonthly, breakdown, badge } = compute(card);

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
        <img src="../../images/icons/sub_monitor.svg" alt="${tabTitle}" />
        <h3 class="plan_title">${card.name}</h3>

        <div class="plan_price">
          <span class="plan_price_label">최종 월 요금</span>
          <strong class="plan_price_value">${fmtMonthly(finalMonthly)}</strong>
        </div>

        <hr class="plan_divider" />

        <dl class="plan_spec">${rows}</dl>

        

        <div class="plan_actions">
        ${isTvTab ? `<p class="plan_note">※ 셋탑박스 임대료 포함</p>` : ``}
          <a class="plan_btn" href="../form.html">${card.cta?.label || "상담문의"}</a>
        </div>
      </article>
    `;
  };

  const renderCards = () => {
    const tab = plan.data[state.tabId];
    if (!tab) return;

    els.title.textContent = tab.title;

    const isTvTab = state.tabId === "internet_tv";
    const total = tab.cards.length;

    // 기본 3개는 항상 상단 배치
    const baseCards = isTvTab ? tab.cards.slice(0, 3) : tab.cards;
    const baseHtml = baseCards
      .map((card) => renderCard(tab.title, card, isTvTab))
      .join("");

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

  const syncOptionsFromUI = () => {
    state.opts.wifi = !!els.wifi?.checked;
    state.opts.mobile_bundle = !!els.mobile?.checked;
  };

  // 상단 탭
  els.tabs?.addEventListener("click", (e) => {
    const btn = e.target.closest(".tab_btn");
    if (!btn) return;

    state.tabId = btn.dataset.tab;
    state.showMore = false; // 더보기 버튼 우선 false로 초기화

    els.tabBtns().forEach((b) => b.classList.toggle("is-active", b === btn));
    renderCards();
  });

  // 옵션 변경
  document.querySelector("#prod")?.addEventListener("change", (e) => {
    if (!e.target.classList.contains("check_input")) return;
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
  syncOptionsFromUI();
  renderCards();
});