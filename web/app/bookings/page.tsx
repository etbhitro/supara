"use client";

import { BookingBoard } from "@/components/BookingBoard";
import { NoAccess } from "@/components/DataShell";
import { PageHeader } from "@/components/PageHeader";
import { useStore } from "@/lib/store";

export default function BookingsPage() {
  const { state } = useStore();
  if (state.role === "staff") return <NoAccess what="Брони" />;
  return (
    <>
      <PageHeader title="Брони" />
      <BookingBoard showRequests />
    </>
  );
}
