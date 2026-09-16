import { PatientRecordView } from "@/components/views/PatientRecordView";

export default async function CasePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PatientRecordView caseId={id} />;
}
