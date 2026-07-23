import SampleForm from "@/components/SampleForm";
import { getCurrentUser } from "@/lib/session";

export default async function NewSampleRequestPage() {
  const user = await getCurrentUser();

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">WiSM製品 サンプル申請</h1>
        <p className="mt-1 text-sm text-slate-600">
          入力して送信すると、企画側の一覧に申請が追加されます。
        </p>
      </div>
      <SampleForm currentUser={user} />
    </div>
  );
}
