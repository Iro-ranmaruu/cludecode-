"use client";

import { useEffect, useState, type RefObject } from "react";

export function useRequiredProgress(formRef: RefObject<HTMLFormElement | null>) {
  const [progress, setProgress] = useState({ filled: 0, total: 0 });

  useEffect(() => {
    const form = formRef.current;
    if (!form) return;

    function compute() {
      const els = Array.from(
        form!.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
          "[required]"
        )
      );
      const seenRadioNames = new Set<string>();
      let total = 0;
      let filled = 0;
      for (const el of els) {
        if (el instanceof HTMLInputElement && el.type === "radio") {
          if (seenRadioNames.has(el.name)) continue;
          seenRadioNames.add(el.name);
          total++;
          if (form!.querySelector(`input[name="${CSS.escape(el.name)}"]:checked`)) filled++;
          continue;
        }
        total++;
        if (el instanceof HTMLInputElement && el.type === "checkbox") {
          if (el.checked) filled++;
        } else if (el.value.trim() !== "") {
          filled++;
        }
      }
      setProgress({ filled, total });
    }

    compute();
    form.addEventListener("input", compute);
    form.addEventListener("change", compute);
    const observer = new MutationObserver(compute);
    observer.observe(form, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["required"],
    });

    return () => {
      form.removeEventListener("input", compute);
      form.removeEventListener("change", compute);
      observer.disconnect();
    };
  }, [formRef]);

  return progress;
}

function ProgressCheckIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      className="h-4 w-4 shrink-0"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 10.5 8 14.5 16 5.5" />
    </svg>
  );
}

export function RequiredProgressBar({ filled, total }: { filled: number; total: number }) {
  const pct = total === 0 ? 0 : Math.round((filled / total) * 100);
  const complete = total > 0 && filled === total;
  const ringGradient = complete
    ? "linear-gradient(135deg, #34d399, #2dd4bf, #22d3ee)"
    : "linear-gradient(135deg, #f472b6, #a78bfa, #38bdf8)";
  const barGradient = complete
    ? "linear-gradient(90deg, #10b981, #14b8a6, #06b6d4)"
    : "linear-gradient(90deg, #ec4899, #8b5cf6, #38bdf8)";

  return (
    <div className="sticky top-0 z-30 -mt-2 pt-2 pb-2">
      <div
        className="rounded-2xl p-[1.5px] shadow-lg shadow-indigo-200/50 transition-[background-image] duration-500"
        style={{ backgroundImage: ringGradient }}
      >
        <div className="rounded-[15px] bg-white/90 px-4 py-3 backdrop-blur-xl">
          <div className="flex items-center justify-between gap-3">
            <span
              className={`flex items-center gap-1.5 text-sm font-bold ${
                complete
                  ? "text-emerald-600"
                  : "bg-gradient-to-r from-fuchsia-600 via-violet-600 to-sky-600 bg-clip-text text-transparent"
              }`}
            >
              {complete && (
                <span className="inline-flex h-4 w-4 animate-[progress-pop_0.4s_ease-out] items-center justify-center text-emerald-500">
                  <ProgressCheckIcon />
                </span>
              )}
              {complete ? "入力完了！" : "入力進捗"}
            </span>
            <span
              className="rounded-full px-2.5 py-0.5 text-xs font-extrabold tabular-nums text-white shadow-sm transition-[background-image] duration-500"
              style={{ backgroundImage: barGradient }}
            >
              {filled} / {total}（{pct}%）
            </span>
          </div>
          <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="relative h-full overflow-hidden rounded-full transition-[width] duration-500 ease-out"
              style={{ width: `${pct}%`, backgroundImage: barGradient }}
            >
              <div className="absolute inset-0 -translate-x-full animate-[progress-shimmer_1.8s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/50 to-transparent" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const ERROR_BORDER_CLASSES = ["border-rose-400", "ring-1", "ring-rose-300"];

export function validateAndHighlight(form: HTMLFormElement): boolean {
  if (form.checkValidity()) return true;

  const invalids = Array.from(form.querySelectorAll<HTMLElement>(":invalid"));
  invalids.forEach((el) => {
    el.classList.add(...ERROR_BORDER_CLASSES);
    const parent = el.parentElement;
    if (parent && !parent.querySelector("[data-field-error]")) {
      const msg = document.createElement("p");
      msg.setAttribute("data-field-error", "");
      msg.className = "mt-1 text-xs font-medium text-rose-600";
      msg.textContent = "この項目は必須です";
      parent.appendChild(msg);
    }

    const clear = () => {
      const stillInvalid =
        (el instanceof HTMLInputElement ||
          el instanceof HTMLSelectElement ||
          el instanceof HTMLTextAreaElement) &&
        !el.checkValidity();
      if (stillInvalid) return;
      el.classList.remove(...ERROR_BORDER_CLASSES);
      parent?.querySelector("[data-field-error]")?.remove();
      el.removeEventListener("input", clear);
      el.removeEventListener("change", clear);
    };
    el.addEventListener("input", clear);
    el.addEventListener("change", clear);
  });

  invalids[0]?.scrollIntoView({ behavior: "smooth", block: "center" });
  invalids[0]?.focus();
  return false;
}

export function ValidationErrorBanner({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <div className="rounded-md border border-rose-300 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
      未入力の必須項目があります。赤枠で示した項目をご確認のうえ入力してください。
    </div>
  );
}
