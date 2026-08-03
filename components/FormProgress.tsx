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
    observer.observe(form, { childList: true, subtree: true });

    return () => {
      form.removeEventListener("input", compute);
      form.removeEventListener("change", compute);
      observer.disconnect();
    };
  }, [formRef]);

  return progress;
}

export function RequiredProgressBar({ filled, total }: { filled: number; total: number }) {
  const pct = total === 0 ? 0 : Math.round((filled / total) * 100);
  const complete = total > 0 && filled === total;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <div className="mb-1.5 flex items-center justify-between text-xs font-medium text-slate-600">
        <span>入力進捗（必須項目）</span>
        <span className={complete ? "font-semibold text-emerald-600" : ""}>
          {filled} / {total} 項目（{pct}%）
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
        <div
          className={`h-full rounded-full transition-all duration-200 ${
            complete ? "bg-emerald-500" : "bg-slate-900"
          }`}
          style={{ width: `${pct}%` }}
        />
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
