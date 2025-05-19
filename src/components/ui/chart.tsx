
import * as React from "react";
import { cn } from "@/lib/utils";
import { Tooltip, ResponsiveContainer } from 'recharts';

const ChartTooltipValueContext = React.createContext<{ 
  content: React.ReactNode; 
  label: React.ReactNode; 
  payload: any[]; 
  color: string; 
}>({ 
  content: null, 
  label: null, 
  payload: [], 
  color: 'currentColor' 
});

const useChartTooltipContext = () => {
  const context = React.useContext(ChartTooltipValueContext);
  if (!context) {
    throw new Error("ChartTooltip must be used within a ChartTooltipProvider");
  }
  return context;
};

export interface ChartContextProps {
  config: Record<string, { color?: string }>;
}

const ChartContext = React.createContext<ChartContextProps>({ config: {} });

export function ChartContainer({
  children,
  config = {},
  className,
}: {
  children: React.ReactNode;
  config?: Record<string, { color?: string }>;
  className?: string;
}) {
  return (
    <ChartContext.Provider value={{ config }}>
      <div className={cn("w-full h-full", className)}>
        {children}
      </div>
    </ChartContext.Provider>
  );
}

export function ChartTooltip({
  children,
  content,
  ...props
}: React.ComponentPropsWithoutRef<typeof Tooltip>) {
  return (
    <Tooltip
      {...props}
      animationDuration={200}
      animationEasing="ease-in-out"
      content={({ active, payload, label }) => {
        if (!active || !payload?.length) {
          return null;
        }

        return (
          <ChartTooltipValueContext.Provider
            value={{
              content: children,
              label,
              payload,
              color: "currentColor",
            }}
          >
            {content ? content({ active, payload, label }) : children}
          </ChartTooltipValueContext.Provider>
        );
      }}
    />
  );
}

export function ChartTooltipContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const { payload, label } = useChartTooltipContext();
  const chartContext = React.useContext(ChartContext);

  if (!payload?.length) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-1 rounded-md border bg-background p-2 shadow-md",
        className
      )}
      {...props}
    >
      <div className="text-xs font-medium text-center text-foreground">{label}</div>
      <div className="grid gap-0.5">
        {payload.map((data, i) => {
          // Get color from config when possible
          const dataKey = data.dataKey;
          const color = chartContext.config[dataKey]?.color ?? data.color;

          // Check if the value is a number
          const value = typeof data.value === "number"
            ? data.value.toLocaleString()
            : data.value;

          return (
            <div key={i} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1">
                <span
                  className="size-2 rounded-[2px]"
                  style={{ backgroundColor: color }}
                />
                <span className="text-xs text-muted-foreground">{data.name}</span>
              </div>
              <span className="text-xs font-medium text-foreground">{value}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
