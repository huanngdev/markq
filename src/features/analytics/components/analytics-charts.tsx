"use client";

import { Bar, BarChart, CartesianGrid, Pie, PieChart, Text, XAxis, YAxis, type YAxisTickContentProps } from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import type { AnalyticsTopicRow } from "../topic-rows";

const outcomeConfig = {
  correct: { label: "Correct", color: "var(--chart-2)" },
  incorrect: { label: "Incorrect", color: "var(--destructive)" },
  unanswered: { label: "Unanswered", color: "var(--chart-4)" },
} satisfies ChartConfig;
const mistakeConfig = { incorrectCount: { label: "Incorrect", color: "var(--destructive)" } } satisfies ChartConfig;

function TopicTick({ x, y, payload }: YAxisTickContentProps) {
  return (
    <Text x={x} y={y} width={110} maxLines={1} textAnchor="end" verticalAnchor="middle" fontSize={12} className="fill-muted-foreground">
      {String(payload.value)}
    </Text>
  );
}

export function AnalyticsCharts({ correct, incorrect, unanswered, topics }: {
  correct: number;
  incorrect: number;
  unanswered: number;
  topics: AnalyticsTopicRow[];
}) {
  const outcomes = [
    { outcome: "correct", count: correct, fill: "var(--color-correct)" },
    { outcome: "incorrect", count: incorrect, fill: "var(--color-incorrect)" },
    { outcome: "unanswered", count: unanswered, fill: "var(--color-unanswered)" },
  ];
  const mistakes = topics.filter((topic) => topic.incorrectCount > 0).slice(0, 8);

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
      <Card className="min-w-0">
        <CardHeader>
          <CardTitle>Answer outcomes</CardTitle>
          <CardDescription>{correct} correct · {incorrect} incorrect · {unanswered} unanswered</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={outcomeConfig} className="h-72 w-full aspect-auto" aria-label={`Answer outcomes: ${correct} correct, ${incorrect} incorrect, ${unanswered} unanswered`}>
            <PieChart accessibilityLayer>
              <ChartTooltip content={<ChartTooltipContent nameKey="outcome" hideLabel />} />
              <Pie data={outcomes} dataKey="count" nameKey="outcome" innerRadius="55%" outerRadius="80%" strokeWidth={2} isAnimationActive={false} />
              <ChartLegend content={<ChartLegendContent nameKey="outcome" />} />
            </PieChart>
          </ChartContainer>
        </CardContent>
      </Card>
      <Card className="min-w-0">
        <CardHeader>
          <CardTitle>Most frequent mistakes</CardTitle>
          <CardDescription>Up to 8 topics, ranked from most incorrect answers to fewest.</CardDescription>
        </CardHeader>
        <CardContent>
          {mistakes.length > 0 ? (
            <ChartContainer config={mistakeConfig} className="h-72 w-full aspect-auto" aria-label="Incorrect answers by topic; exact values are in the Knowledge review table below.">
              <BarChart accessibilityLayer data={mistakes} layout="vertical" margin={{ left: 0, right: 16 }}>
                <CartesianGrid horizontal={false} />
                <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="title" width={120} tickLine={false} axisLine={false} tick={TopicTick} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="incorrectCount" fill="var(--color-incorrectCount)" radius={4} maxBarSize={28} isAnimationActive={false} />
              </BarChart>
            </ChartContainer>
          ) : (
            <Empty className="h-72">
              <EmptyHeader>
                <EmptyTitle>No incorrect answers in this view</EmptyTitle>
                <EmptyDescription>Unanswered questions are counted separately, not as incorrect answers.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
