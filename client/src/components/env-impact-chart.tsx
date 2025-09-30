import {
  VictoryChart,
  VictoryBar,
  VictoryAxis,
  VictoryTheme,
  VictoryTooltip,
  VictoryContainer,
} from "victory";

type ImpactMetrics = {
  ecoScore: number | string;
  co2Emissions: number | string;
  renewableEnergy: number | string;
  recyclableMaterials: number | string;
  recycledContent: number | string;
  waterUsage: number | string;
  landUsage: number | string;
};

export default function EnvImpactChart({ impact }: { impact: ImpactMetrics }) {
  const allMetrics = [
    { 
      metric: "CO₂", 
      value: impact.co2Emissions,
      displayValue: typeof impact.co2Emissions === 'number' ? `${impact.co2Emissions}g/100g` : "NA",
      unit: "g/100g",
      inverted: true,
      description: "Lower is better"
    },
    { 
      metric: "Renewable", 
      value: impact.renewableEnergy,
      displayValue: typeof impact.renewableEnergy === 'number' ? `${impact.renewableEnergy}%` : "NA",
      unit: "%",
      inverted: false,
      description: "Higher is better"
    },
    { 
      metric: "Recyclable", 
      value: impact.recyclableMaterials,
      displayValue: typeof impact.recyclableMaterials === 'number' ? `${impact.recyclableMaterials}%` : "NA", 
      unit: "%",
      inverted: false,
      description: "Higher is better"
    },
    { 
      metric: "Recycled", 
      value: impact.recycledContent,
      displayValue: typeof impact.recycledContent === 'number' ? `${impact.recycledContent}%` : "NA",
      unit: "%",
      inverted: false,
      description: "Higher is better"
    },
    { 
      metric: "Water", 
      value: impact.waterUsage,
      displayValue: typeof impact.waterUsage === 'number' ? `${impact.waterUsage}%` : "NA",
      unit: "%",
      inverted: false,
      description: "Higher is better"
    },
    { 
      metric: "Land", 
      value: impact.landUsage,
      displayValue: typeof impact.landUsage === 'number' ? `${impact.landUsage}%` : "NA",
      unit: "%",
      inverted: false,
      description: "Higher is better"
    },
  ];
  
  const data = allMetrics.filter(item => typeof item.value === 'number');

  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No environmental data available</p>
      </div>
    );
  }

  return (
    <VictoryChart
      theme={VictoryTheme.material}
      domainPadding={25}
      height={220}
      containerComponent={<VictoryContainer responsive={true} />}
      padding={{ top: 20, bottom: 40, left: 50, right: 20 }}
    >
      <VictoryAxis
        tickFormat={(t) => t}
        style={{
          axis: { stroke: "#e5e7eb" },
          tickLabels: { 
            fontSize: 10, 
            padding: 8,
            fill: "#6b7280",
            fontWeight: 500
          },
          grid: { stroke: "transparent" }
        }}
      />
      <VictoryAxis
        dependentAxis
        tickFormat={(t) => Math.round(t)}
        style={{
          axis: { stroke: "#e5e7eb" },
          tickLabels: { 
            fontSize: 9, 
            padding: 5,
            fill: "#9ca3af"
          },
          grid: { stroke: "#f3f4f6", strokeDasharray: "4,4" }
        }}
      />
      <VictoryBar
        data={data}
        x="metric"
        y="value"
        labels={({ datum }) => datum.displayValue}
        labelComponent={
          <VictoryTooltip 
            flyoutStyle={{
              fill: "#111827",
              stroke: "#10b981",
              strokeWidth: 1
            }}
            style={{
              fill: "#ffffff",
              fontSize: 11,
              fontWeight: 600
            }}
          />
        }
        animate={{
          duration: 800,
          easing: "cubicOut",
          onLoad: { duration: 800 }
        }}
        cornerRadius={{ top: 6, bottom: 0 }}
        barWidth={18}
        style={{
          data: {
            fill: ({ datum }) => {
              if (datum.metric === "CO₂") {
                return datum.value < 100
                  ? "url(#greenGradient)"
                  : datum.value < 300
                  ? "url(#yellowGradient)"
                  : "url(#redGradient)";
              }
              return datum.value >= 70
                ? "url(#greenGradient)"
                : datum.value >= 40
                ? "url(#yellowGradient)"
                : "url(#redGradient)";
            },
            stroke: ({ datum }) => {
              if (datum.metric === "CO₂") {
                return datum.value < 100
                  ? "#10b981"
                  : datum.value < 300
                  ? "#f59e0b"
                  : "#ef4444";
              }
              return datum.value >= 70
                ? "#10b981"
                : datum.value >= 40
                ? "#f59e0b"
                : "#ef4444";
            },
            strokeWidth: 0,
          }
        }}
      />
      <defs>
        <linearGradient id="greenGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#34d399" stopOpacity={1} />
          <stop offset="100%" stopColor="#10b981" stopOpacity={0.8} />
        </linearGradient>
        <linearGradient id="yellowGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fbbf24" stopOpacity={1} />
          <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.8} />
        </linearGradient>
        <linearGradient id="redGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#f87171" stopOpacity={1} />
          <stop offset="100%" stopColor="#ef4444" stopOpacity={0.8} />
        </linearGradient>
      </defs>
    </VictoryChart>
  );
}
