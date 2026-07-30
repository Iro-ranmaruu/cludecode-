import { getUserById } from "@/lib/auth";
import { findEmployeeEmail } from "@/lib/employee-directory-repo";
import { sendMail } from "@/lib/mailer";
import { STATUS_LABEL, type RequestRecord } from "@/lib/types";
import { DEFECT_STATUS_LABEL, type DefectRequestRecord } from "@/lib/defect-types";
import { SAMPLE_STATUS_LABEL, type SampleRequestRecord } from "@/lib/sample-types";

function recipientEmail(createdBy: string | null): string | null {
  if (!createdBy) return null;
  const user = getUserById(createdBy);
  if (!user) return null;
  const directoryEmail = findEmployeeEmail({
    employeeNumber: user.employeeNumber,
    name: user.name,
  });
  return directoryEmail || user.email || null;
}

export async function notifyTokkaStatusChange(request: RequestRecord): Promise<void> {
  const email = recipientEmail(request.createdBy);
  if (!email) return;

  const itemLines = request.items
    .map((item, i) => {
      const price =
        item.decidedWholesalePrice !== null ? `　決定仕切額: ${item.decidedWholesalePrice}` : "";
      return `  商品${i + 1}: ${item.productName || "-"}　判定: ${item.decision}${price}`;
    })
    .join("\n");

  await sendMail({
    to: email,
    subject: `【WiSM製品アプリ】特価申請の処理結果（${STATUS_LABEL[request.status]}）`,
    text:
      `申請いただいた特価申請の処理結果をお知らせします。\n\n` +
      `得意先施設名: ${request.customerFacilityName || "-"}\n` +
      `申請ステータス: ${STATUS_LABEL[request.status]}\n\n` +
      `商品明細:\n${itemLines}\n\n` +
      (request.planningRemarks ? `企画コメント:\n${request.planningRemarks}\n\n` : "") +
      `詳細はアプリの「特価申請 処理状況一覧」からご確認ください。`,
  });
}

export async function notifyFuguaiStatusChange(request: DefectRequestRecord): Promise<void> {
  const email = recipientEmail(request.createdBy);
  if (!email) return;

  await sendMail({
    to: email,
    subject: `【WiSM製品アプリ】不具合処理依頼の処理結果（${DEFECT_STATUS_LABEL[request.status]}）`,
    text:
      `依頼いただいた不具合処理依頼の処理結果をお知らせします。\n\n` +
      `得意先施設名: ${request.customerFacilityName || "-"}\n` +
      `処理ステータス: ${DEFECT_STATUS_LABEL[request.status]}\n\n` +
      (request.planningComment ? `企画コメント:\n${request.planningComment}\n\n` : "") +
      `詳細はアプリの「不具合処理依頼 処理状況一覧」からご確認ください。`,
  });
}

export async function notifySampleStatusChange(request: SampleRequestRecord): Promise<void> {
  const email = recipientEmail(request.createdBy);
  if (!email) return;

  await sendMail({
    to: email,
    subject: `【WiSM製品アプリ】サンプル依頼の処理結果（${SAMPLE_STATUS_LABEL[request.status]}）`,
    text:
      `申請いただいたサンプル依頼の処理結果をお知らせします。\n\n` +
      `サンプル依頼No: ${request.requestNo || "-"}\n` +
      `処理ステータス: ${SAMPLE_STATUS_LABEL[request.status]}\n\n` +
      (request.planningComment ? `企画コメント:\n${request.planningComment}\n\n` : "") +
      (request.logisticsComment ? `物流コメント:\n${request.logisticsComment}\n\n` : "") +
      `詳細はアプリの「サンプル依頼 処理状況一覧」からご確認ください。`,
  });
}
