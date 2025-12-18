document.addEventListener("DOMContentLoaded", async () => {
  const res = await fetch("../../json/planData.json");
  const plan = await res.json();

  const els = {
    tabs: document.querySelector("#prod .tab_wrap"),
    tabBtns: () => document.querySelectorAll("#prod .tab_btn"),
    title: document.querySelector("#prod .prod_wrap h1"),
    cards: document.querySelector("#prod .card_wrap"),
    wifi: document.querySelector('#prod .check_input#wifi'),
    mobile: document.querySelector('#prod .check_input#mobile_bundle') || document.querySelector('#prod .check_input#phone'), // phone 매핑
  };
  const state = {
    tabId: "internet_only",
    opts: { wifi: false, mobile_bundle: false },
  };
//셋톱박스 문구 노출
  const showSetTopNote = state.tabId === "internet_tv";

  const fmtWon = (n) => `${Number(n).toLocaleString("ko-KR")}원`;
  const fmtMonthly = (n) => `월 ${Number(n).toLocaleString("ko-KR")}원`;

  const optionKey = () => {
    const order = plan.rules?.optionKeyOrder || ["wifi", "mobile_bundle"];
    const joiner = plan.rules?.optionKeyJoiner || "+";
    const picked = order.filter((k) => state.opts[k]);
    return picked.join(joiner);
  };

  const compute = (card) => {
    const key = optionKey();
    const adj = key ? card.optionAdjustments?.[key] : null;

    const finalMonthly = card.base.finalMonthly + (adj?.deltaMonthly || 0);

    const breakdown = { ...(card.base.breakdown || {}) };
    const deltaB = adj?.deltaBreakdown || {};
    for (const k in deltaB) breakdown[k] = (breakdown[k] || 0) + deltaB[k];

    // totalDiscount는 제공값이 있더라도 “Discount 키 합”으로 다시 계산(옵션 반영)
    const totalDiscount =
      Object.entries(breakdown)
        .filter(([k, v]) => k.endsWith("Discount") && k !== "totalDiscount")
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

  const orderKeys = ["basePrice", "contractDiscount", "tvDiscount", "bundleDiscount", "wifiFee", "totalDiscount"];

  const renderCards = () => {
    const tab = plan.data[state.tabId];
    els.title.textContent = tab.title;

    const html = tab.cards.map((card) => {
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
          ${badge ? `<span class="plan_badge">${badge.replace("\n","<br/>")}</span>` : ""}
          <img src="../../images/icons/sub_monitor.svg" alt="${tab.title}" />
          <h3 class="plan_title">${card.name}</h3>

          <div class="plan_price">
            <span class="plan_price_label">최종 월 요금</span>
            <strong class="plan_price_value">${fmtMonthly(finalMonthly)}</strong>
          </div>

          <hr class="plan_divider" />

          <dl class="plan_spec">${rows}</dl>

          ${showSetTopNote ? `<p class="plan_note">※ 셋탑박스 임대료 포함</p>` : ``}

          <div class="plan_actions">
            <a class="plan_btn" href="#">${card.cta?.label || "상담문의"}</a>
          </div>
        </article>
      `;
    }).join("");

    els.cards.innerHTML = html;
  };

  const syncOptionsFromUI = () => {
    state.opts.wifi = !!els.wifi?.checked;
    state.opts.mobile_bundle = !!els.mobile?.checked;
  };

  // 탭 클릭
  els.tabs.addEventListener("click", (e) => {
    const btn = e.target.closest(".tab_btn");
    if (!btn) return;
    state.tabId = btn.dataset.tab;

    els.tabBtns().forEach((b) => b.classList.toggle("is-active", b === btn));
    renderCards();
  });

  // 옵션 변경
  document.querySelector("#prod").addEventListener("change", (e) => {
    if (!e.target.classList.contains("check_input")) return;
    syncOptionsFromUI();
    renderCards();
  });

  // 초기 세팅
  els.tabBtns().forEach((b) => b.classList.toggle("is-active", b.dataset.tab === state.tabId));
  syncOptionsFromUI();
  renderCards();
});