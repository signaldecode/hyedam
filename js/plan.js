document.addEventListener("DOMContentLoaded", async () => {
  const res = await fetch("../../json/planInternetData.json");
  const data = await res.json();

  const els = {
    providerTabs: document.querySelector("#providerTabs"),
    speedTabs: document.querySelector("#speedTabs"),
    tableBody: document.querySelector("#planTableBody"),
  };

  const state = {
    providerId: data.rules?.defaultProviderId || data.providers?.[0]?.id || null,
    speedId: data.rules?.defaultSpeedId || "100m",
  };

  // URL 파라미터로 탭 액티브 추가
  const readQuery = () => {
    const sp = new URLSearchParams(window.location.search);
    return {
      providerId: sp.get("provider"),
      speedId: sp.get("speed"),
    };
  };

  const getProviderById = (providerId) =>
    data.providers.find((p) => p.id === providerId) || null;

  const applyQueryToState = () => {
    const q = readQuery();
    if (q.providerId && getProviderById(q.providerId)) state.providerId = q.providerId;
    if (q.speedId) state.speedId = q.speedId;
  };

  const syncUrl = (replace = false) => {
    const sp = new URLSearchParams(window.location.search);
    sp.set("provider", state.providerId || "");
    sp.set("speed", state.speedId || "");
    if (!state.providerId) sp.delete("provider");
    if (!state.speedId) sp.delete("speed");

    const next = `${window.location.pathname}${
      sp.toString() ? `?${sp.toString()}` : ""
    }${window.location.hash || ""}`;
    const curr = `${window.location.pathname}${window.location.search}${
      window.location.hash || ""
    }`;
    if (next === curr) return;

    if (replace) window.history.replaceState({}, "", next);
    else window.history.pushState({}, "", next);
  };

  const fmtMonthly = (n) => `${Number(n).toLocaleString("ko-KR")}`;

  const getProvider = () =>
    data.providers.find((p) => p.id === state.providerId) || null;

  const getPlans = () => {
    const provider = getProvider();
    const speed = provider?.speeds?.find((s) => s.id === state.speedId) || null;
    return speed?.plans || [];
  };

  const setActive = (container, selector, isActiveFn) => {
    container.querySelectorAll(selector).forEach((btn) => {
      const on = isActiveFn(btn);
      btn.classList.toggle("is-active", on);
      btn.setAttribute("aria-selected", on ? "true" : "false");
    });
  };

  const renderProviderTabs = () => {
    els.providerTabs.innerHTML = data.providers
      .map(
        (p) => `
        <button class="tab_btn" type="button" role="tab" aria-selected="false" data-provider="${p.id}">
          <span>${p.label}</span>
        </button>
      `
      )
      .join("");

    setActive(
      els.providerTabs,
      ".tab_btn",
      (btn) => btn.dataset.provider === state.providerId
    );
  };

  const renderSpeedTabs = () => {
    const provider = getProvider();
    if (!provider) return;

    const speeds = provider.speeds || [];

    // 현재 speedId가 이 통신사에 없으면 첫 번째 speed로 보정
    if (!speeds.some((s) => s.id === state.speedId)) {
      state.speedId = speeds[0]?.id || "100m";
    }

    els.speedTabs.innerHTML = speeds
      .map(
        (s) => `
        <button class="tab_btn" type="button" role="tab" aria-selected="false" data-speed="${s.id}">
          <span>${s.label}</span>
        </button>
      `
      )
      .join("");

    setActive(
      els.speedTabs,
      ".tab_btn",
      (btn) => btn.dataset.speed === state.speedId
    );
  };
  const renderTable = () => {
    const plans = getPlans();

    els.tableBody.innerHTML = plans.length
      ? plans
          .map(
            (p) => `
            <tr>
              <td>${p.product}</td>
              <td>${fmtMonthly(p.monthly)}</td>
              <td>${p.benefit}</td>
            </tr>
          `
          )
          .join("")
      : `<tr><td colspan="3">상품이 없습니다.</td></tr>`;
  };

  const renderAll = () => {
    renderProviderTabs();
    renderSpeedTabs();
    renderTable();
    syncUrl(true); // 상태 보정(특히 speedId) 이후 URL을 현재 상태로 정리
  };

  els.providerTabs.addEventListener("click", (e) => {
    const btn = e.target.closest(".tab_btn");
    if (!btn) return;

    state.providerId = btn.dataset.provider;
    // 속도는 "고정 탭"이므로 유지
    renderAll();
    syncUrl(false);
  });

  els.speedTabs.addEventListener("click", (e) => {
    const btn = e.target.closest(".tab_btn");
    if (!btn) return;

    state.speedId = btn.dataset.speed;
    setActive(els.speedTabs, ".tab_btn", (b) => b.dataset.speed === state.speedId);
    renderTable();
    syncUrl(false);
  });

  // 초기: URL 파라미터로 탭 활성화
  applyQueryToState();
  renderAll();

  // 뒤로가기/앞으로가기: URL 기준으로 다시 활성화
  window.addEventListener("popstate", () => {
    applyQueryToState();
    renderAll();
  });
});