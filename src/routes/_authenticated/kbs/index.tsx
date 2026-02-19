import { createFileRoute } from "@tanstack/react-router";
import { KBListPage } from "@/components/kbs/kb-list-page";

export const Route = createFileRoute("/_authenticated/kbs/")({
  component: KBListPage,
  staticData: { breadcrumb: "Knowledge Bases" },
});
