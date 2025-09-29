import {
  VictoryChart,
  VictoryBar,
  VictoryAxis,
  VictoryTheme,
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
    { metric: "CO₂", value: impact.co2Emissions },
    { metric: "Renewable", value: impact.renewableEnergy },
    { metric: "Recyclable", value: impact.recyclableMaterials },
    { metric: "Recycled", value: impact.recycledContent },
    { metric: "Water", value: impact.waterUsage },
    { metric: "Land", value: impact.landUsage },
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
        tickFormat={(t) => `${t}%`}
        style={{
          tickLabels: { fontSize: 8, padding: 5 },
        }}
      />
      <VictoryBar
        data={data}
        x="metric"
        y="value"
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
