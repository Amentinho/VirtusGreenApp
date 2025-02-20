import {
  VictoryChart,
  VictoryBar,
  VictoryAxis,
  VictoryTheme,
} from "victory";

type ImpactMetrics = {
  ecoScore: number;
  co2Emissions: number;
  renewableEnergy: number;
  recyclableMaterials: number;
  recycledContent: number;
  waterUsage: number;
  landUsage: number;
};

export default function EnvImpactChart({ impact }: { impact: ImpactMetrics }) {
  const data = [
    { metric: "CO₂", value: impact.co2Emissions },
    { metric: "Renewable", value: impact.renewableEnergy },
    { metric: "Recyclable", value: impact.recyclableMaterials },
    { metric: "Recycled", value: impact.recycledContent },
    { metric: "Water", value: impact.waterUsage },
    { metric: "Land", value: impact.landUsage },
  ];

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
