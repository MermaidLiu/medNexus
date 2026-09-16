import { redirect } from "next/navigation";

/** 临床诊疗已拆至独立院方 MVP，科研平台不再提供此模块 */
export default function ClinicalDiagnosisRedirect() {
  redirect("/");
}
