import { redirect } from "next/navigation";

/** 队列入库已并入 NACT 预测页 */
export default function CohortRedirectPage() {
  redirect("/clinical/nact-ovarian");
}
