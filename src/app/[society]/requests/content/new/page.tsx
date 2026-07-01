"use client";

import { useParams } from "next/navigation";
import { ContentRequestForm } from "@/components/requests/ContentRequestForm";

export default function NewContentRequestPage() {
  const params = useParams<{ society: string }>();
  return <ContentRequestForm societySlug={params.society} />;
}
