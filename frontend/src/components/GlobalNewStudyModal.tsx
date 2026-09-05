"use client";

import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { createStudy, runPipeline } from "@/lib/api";
import { NewStudyModal } from "./NewStudyModal";
import { useState } from "react";

export function GlobalNewStudyModal() {
  const router = useRouter();
  const { showNewStudyModal, setShowNewStudyModal, refreshStudies, pendingQuery, setPendingQuery } =
    useApp();
  const [loading, setLoading] = useState(false);

  if (!showNewStudyModal) return null;

  const handleSubmit = async (topic: string) => {
    setLoading(true);
    try {
      const study = await createStudy(topic);
      const running = await runPipeline(study.id);
      setShowNewStudyModal(false);
      setPendingQuery("");
      await refreshStudies();
      router.push(`/research?id=${running.id}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <NewStudyModal
      initialTopic={pendingQuery}
      onSubmit={handleSubmit}
      onClose={() => setShowNewStudyModal(false)}
      loading={loading}
    />
  );
}
