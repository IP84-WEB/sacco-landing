(() => {
  const root = document.documentElement;
  const body = document.body;
  const panel = document.querySelector("#accessibility-panel");
  const overlay = document.querySelector("[data-accessibility-overlay]");
  const openButton = document.querySelector("[data-accessibility-open]");
  const closeButtons = [...document.querySelectorAll("[data-accessibility-close]")];
  const resetButton = document.querySelector("[data-a11y-reset]");
  const profileButtons = [...document.querySelectorAll("[data-a11y-profile]")];
  const settingButtons = [...document.querySelectorAll("[data-a11y-setting]")];
  const scaleUp = document.querySelector("[data-a11y-scale-up]");
  const scaleDown = document.querySelector("[data-a11y-scale-down]");
  const scaleOutput = document.querySelector("[data-a11y-scale-output]");
  const status = document.querySelector("[data-a11y-status]");

  if (!panel || !overlay || !openButton) return;

  const storageKey = "sacco-accessibility-v2";
  const defaultState = {
    scale: 100,
    profiles: {
      seizure: false,
      lowVision: false,
      adhd: false,
      cognitive: false,
      keyboard: false,
      screenReader: false,
      olderAdults: false
    },
    settings: {
      readableFont: false,
      highContrast: false,
      grayscale: false,
      highlightLinks: false,
      pauseMotion: false,
      lineSpacing: false,
      largeCursor: false
    }
  };

  let state = JSON.parse(JSON.stringify(defaultState));
  let lastFocusedElement = null;

  const announce = (message) => {
    if (!status) return;
    status.textContent = "";
    window.setTimeout(() => {
      status.textContent = message;
    }, 20);
  };

  const save = () => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(state));
    } catch (_) {}
  };

  const load = () => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey));
      if (saved && typeof saved === "object") {
        state = {
          ...state,
          ...saved,
          profiles: { ...state.profiles, ...(saved.profiles || {}) },
          settings: { ...state.settings, ...(saved.settings || {}) }
        };
      }
    } catch (_) {}
  };

  const effectiveState = () => {
    const profiles = state.profiles;
    const settings = state.settings;

    let scale = state.scale;
    if (profiles.lowVision) scale = Math.max(scale, 120);
    if (profiles.cognitive) scale = Math.max(scale, 110);
    if (profiles.olderAdults) scale = Math.max(scale, 125);

    return {
      scale,
      readableFont:
        settings.readableFont ||
        profiles.cognitive ||
        profiles.olderAdults ||
        profiles.adhd,
      highContrast:
        settings.highContrast ||
        profiles.lowVision ||
        profiles.olderAdults,
      grayscale: settings.grayscale,
      highlightLinks:
        settings.highlightLinks ||
        profiles.lowVision ||
        profiles.keyboard,
      pauseMotion:
        settings.pauseMotion ||
        profiles.seizure ||
        profiles.adhd,
      lineSpacing:
        settings.lineSpacing ||
        profiles.cognitive ||
        profiles.olderAdults ||
        profiles.adhd,
      largeCursor: settings.largeCursor || profiles.lowVision,
      keyboardFocus: profiles.keyboard,
      distractionFree: profiles.adhd,
      screenReader: profiles.screenReader
    };
  };

  const apply = () => {
    const effective = effectiveState();

    root.style.fontSize = `${effective.scale}%`;
    root.classList.toggle("a11y-readable-font", effective.readableFont);
    root.classList.toggle("a11y-high-contrast", effective.highContrast);
    root.classList.toggle("a11y-grayscale", effective.grayscale);
    root.classList.toggle("a11y-highlight-links", effective.highlightLinks);
    root.classList.toggle("a11y-pause-motion", effective.pauseMotion);
    root.classList.toggle("a11y-line-spacing", effective.lineSpacing);
    root.classList.toggle("a11y-large-cursor", effective.largeCursor);
    root.classList.toggle("a11y-keyboard-focus", effective.keyboardFocus);
    root.classList.toggle("a11y-distraction-free", effective.distractionFree);

    body.toggleAttribute("data-screen-reader-optimized", effective.screenReader);

    profileButtons.forEach((button) => {
      const key = button.dataset.a11yProfile;
      button.setAttribute("aria-checked", String(Boolean(state.profiles[key])));
    });

    settingButtons.forEach((button) => {
      const key = button.dataset.a11ySetting;
      button.setAttribute("aria-pressed", String(Boolean(state.settings[key])));
    });

    if (scaleOutput) {
      scaleOutput.value = `${effective.scale}%`;
      scaleOutput.textContent = `${effective.scale}%`;
    }

    save();
  };

  const openPanel = () => {
    lastFocusedElement = document.activeElement;
    panel.hidden = false;
    overlay.hidden = false;
    body.classList.add("accessibility-panel-open");
    openButton.setAttribute("aria-expanded", "true");

    requestAnimationFrame(() => {
      panel.classList.add("is-open");
      overlay.classList.add("is-open");
      const firstClose = panel.querySelector("[data-accessibility-close]");
      firstClose?.focus();
    });
  };

  const closePanel = () => {
    panel.classList.remove("is-open");
    overlay.classList.remove("is-open");
    body.classList.remove("accessibility-panel-open");
    openButton.setAttribute("aria-expanded", "false");

    window.setTimeout(() => {
      panel.hidden = true;
      overlay.hidden = true;
      lastFocusedElement?.focus();
    }, 470);
  };

  const trapFocus = (event) => {
    if (event.key !== "Tab" || panel.hidden) return;

    const focusable = [...panel.querySelectorAll(
      'button:not([disabled]), a[href], select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )];

    if (!focusable.length) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  profileButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const key = button.dataset.a11yProfile;
      state.profiles[key] = !state.profiles[key];
      apply();

      const label = button.closest(".accessibility-profile")
        ?.querySelector("h4")?.textContent || "Profile";

      announce(`${label} ${state.profiles[key] ? "enabled" : "disabled"}.`);
    });
  });

  settingButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const key = button.dataset.a11ySetting;
      state.settings[key] = !state.settings[key];
      apply();

      const label = button.textContent.trim().replace(/\s+/g, " ");
      announce(`${label} ${state.settings[key] ? "enabled" : "disabled"}.`);
    });
  });

  scaleUp?.addEventListener("click", () => {
    state.scale = Math.min(150, state.scale + 10);
    apply();
    announce(`Content scaling ${effectiveState().scale} percent.`);
  });

  scaleDown?.addEventListener("click", () => {
    state.scale = Math.max(80, state.scale - 10);
    apply();
    announce(`Content scaling ${effectiveState().scale} percent.`);
  });

  resetButton?.addEventListener("click", () => {
    state = JSON.parse(JSON.stringify(defaultState));
    apply();
    announce("Accessibility settings reset.");
  });

  openButton.addEventListener("click", openPanel);
  closeButtons.forEach((button) => button.addEventListener("click", closePanel));
  overlay.addEventListener("click", closePanel);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !panel.hidden) closePanel();
    trapFocus(event);
  });

  load();
  apply();
})();
