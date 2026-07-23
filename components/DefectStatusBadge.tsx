import { DEFECT_STATUS_LABEL, type DefectStatus } from "@/lib/defect-types";

const STATUS_STYLE: Record<DefectStatus, string> = {
  submitted: "bg-amber-100 text-amber-800",
  in_progress: "bg-sky-100 text-sky-800",
  completed: "bg-emerald-100 text-emerald-800",
  rejected: "bg-rose-100 text-rose-800",
};

export default function DefectStatusBadge({ status }: { status: DefectStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLE[status]}`}
    >
      {DEFECT_STATUS_LABEL[status]}
    </span>
  );
}
