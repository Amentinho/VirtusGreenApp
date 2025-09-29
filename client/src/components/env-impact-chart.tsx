import {
  VictoryChart,
  VictoryBar,
  VictoryAxis,
  VictoryTheme,
  VictoryTooltip,
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
  // Filter out "NA" values and only include numeric data for the chart
  const allMetrics = [
    { 
      metric: "CO₂", 
      value: impact.co2Emissions,
      displayValue: typeof impact.co2Emissions === 'number' ? `${impact.co2Emissions}g` : "NA",
      unit: "g"
    },
    { 
      metric: "Renewable", 
      value: impact.renewableEnergy,
      displayValue: typeof impact.renewableEnergy === 'number' ? `${impact.renewableEnergy}%` : "NA",
      unit: "%"
    },
    { 
      metric: "Recyclable", 
      value: impact.recyclableMaterials,
      displayValue: typeof impact.recyclableMaterials === 'number' ? `${impact.recyclableMaterials}%` : "NA", 
      unit: "%"
    },
    { 
      metric: "Recycled", 
      value: impact.recycledContent,
      displayValue: typeof impact.recycledContent === 'number' ? `${impact.recycledContent}%` : "NA",
      unit: "%"
    },
    { 
      metric: "Water", 
      value: impact.waterUsage,
      displayValue: typeof impact.waterUsage === 'number' ? `${impact.waterUsage}%` : "NA",
      unit: "%"
    },
    { 
      metric: "Land", 
      value: impact.landUsage,
      displayValue: typeof impact.landUsage === 'number' ? `${impact.landUsage}%` : "NA",
      unit: "%"
    },
  ];
  
  // Only include metrics with numeric values (exclude "NA")
  const data = allMetrics.filter(item => typeof item.value === 'number');

  return (
    <VictoryChart
      theme={VictoryTheme.material}
      domainPadding={20}
      height={200}
    >
      <VictoryAxis
        tickFormat={(t) => t}
        style={{
          tickLabels: { fontSize: 8, padding: 5 },
        }}
      />
      <VictoryAxis
        dependentAxis
        tickFormat={(t) => t}
        style={{
          tickLabels: { fontSize: 8, padding: 5 },
        }}
      />
      <VictoryBar
        data={data}
        x="metric"
        y="value"
        labelComponent={<VictoryTooltip />}
        style={{
          data: {
            fill: ({ datum }) =>
              datum.value >= 70
                ? "#059669"
                : datum.value >= 40
                ? "#CA8A04"
                : "#DC2626",
          },
        }}
      />
    </VictoryChart>
  );
}
