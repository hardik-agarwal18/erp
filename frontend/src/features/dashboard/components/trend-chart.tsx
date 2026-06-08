"use client";

import { ReactNode } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export interface TrendChartProps {
  title: string;
  description?: string;
  data: any[];
  dataKeys: { key: string; color?: string; name?: string; type?: "line" | "bar" | "area" }[];
  xAxisKey?: string;
  height?: number;
  valueFormatter?: (val: any) => string;
  headerBadge?: ReactNode;
}

export function TrendChart({ 
  title, 
  description, 
  data, 
  dataKeys, 
  xAxisKey = "month", 
  height = 320, 
  valueFormatter = (val) => val.toString(),
  headerBadge 
}: TrendChartProps) {
  
  const axisProps = {
    axisLine: false,
    tickLine: false,
    tick: { fill: "hsl(var(--muted-foreground))", fontSize: 12 },
  };

  const tooltipProps = {
    contentStyle: { backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' },
    itemStyle: { color: 'hsl(var(--foreground))' }
  };

  const renderLines = () => dataKeys.map((k, i) => (
    <Line 
      key={k.key} 
      dataKey={k.key} 
      name={k.name || k.key}
      stroke={k.color || `hsl(var(--primary))`} 
      strokeWidth={2} 
      dot={false} 
      strokeDasharray={k.type === "line" && i > 0 ? "5 5" : undefined}
    />
  ));

  const renderBars = () => dataKeys.map((k) => (
    <Bar 
      key={k.key} 
      dataKey={k.key} 
      name={k.name || k.key}
      fill={k.color || `hsl(var(--primary))`} 
      radius={[4, 4, 0, 0]} 
    />
  ));

  const renderAreas = () => dataKeys.map((k) => (
    <Area 
      key={k.key} 
      dataKey={k.key} 
      name={k.name || k.key}
      stroke={k.color || `hsl(var(--primary))`} 
      fill={`url(#fill-${k.key})`}
      strokeWidth={2} 
    />
  ));

  const hasArea = dataKeys.some(k => k.type === "area");
  const hasBar = dataKeys.some(k => k.type === "bar");

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
        {headerBadge && <div>{headerBadge}</div>}
      </CardHeader>
      <CardContent style={{ height }} className="flex-1 min-h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          {hasBar ? (
            <BarChart data={data}>
              <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey={xAxisKey} {...axisProps} />
              <YAxis {...axisProps} tickFormatter={valueFormatter} />
              <Tooltip {...tooltipProps} formatter={(val: any) => valueFormatter(val)} />
              <Legend />
              {renderBars()}
            </BarChart>
          ) : hasArea ? (
            <AreaChart data={data}>
              <defs>
                {dataKeys.map(k => (
                  <linearGradient key={`grad-${k.key}`} id={`fill-${k.key}`} x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor={k.color || `hsl(var(--primary))`} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={k.color || `hsl(var(--primary))`} stopOpacity={0.0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey={xAxisKey} {...axisProps} />
              <YAxis {...axisProps} tickFormatter={valueFormatter} />
              <Tooltip {...tooltipProps} formatter={(val: any) => valueFormatter(val)} />
              <Legend />
              {renderAreas()}
            </AreaChart>
          ) : (
            <LineChart data={data}>
              <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey={xAxisKey} {...axisProps} />
              <YAxis {...axisProps} tickFormatter={valueFormatter} />
              <Tooltip {...tooltipProps} formatter={(val: any) => valueFormatter(val)} />
              <Legend />
              {renderLines()}
            </LineChart>
          )}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
