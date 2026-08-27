"use client";

import { createColumnHelper, createPaginatedRowModel, rowPaginationFeature, tableFeatures, useTable } from "@tanstack/react-table";
import { ArrowDown } from "lucide-react";
import Link from "next/link";

import type { AnalyticsTopicRow } from "../topic-rows";

const features = tableFeatures({ rowPaginationFeature, paginatedRowModel: createPaginatedRowModel() });
const helper = createColumnHelper<typeof features, AnalyticsTopicRow>();
const columns = helper.columns([
  helper.accessor("title", {
    header: "Topic",
    cell: ({ row }) => (
      <Link href={row.original.lessonHref} aria-label={`Review ${row.original.title}`}
        className="font-medium underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        {row.original.title}
      </Link>
    ),
  }),
  helper.accessor("subjectTitle", { header: "Subject" }),
  helper.accessor("incorrectCount", {
    header: () => <span className="inline-flex items-center gap-1">Incorrect <ArrowDown className="size-3.5" aria-hidden="true" /></span>,
  }),
  helper.accessor("correctCount", { header: "Correct" }),
  helper.accessor("unansweredCount", { header: "Unanswered" }),
  helper.accessor("questionCount", { header: "Questions" }),
  helper.accessor("accuracyPercent", { header: "Accuracy", cell: ({ getValue }) => `${getValue()}%` }),
]);

export function useTopicTable(data: AnalyticsTopicRow[]) {
  // The server ranks the complete result set before TanStack paginates it.
  return useTable({
    features, columns, data, getRowId: (row) => row.topicId,
    initialState: { pagination: { pageIndex: 0, pageSize: 10 } },
  });
}
