import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'

interface ProbabilityChartProps {
  datos: {
    nombre: string
    similitud: number
    probabilidad: number
  }[]
}

function ProbabilityChart({
  datos,
}: ProbabilityChartProps) {
  const datosGrafico = datos.map((dato) => ({
    nombre: dato.nombre,
    similitud: Number(
      (dato.similitud * 100).toFixed(2)
    ),
    probabilidad: Number(
      (dato.probabilidad * 100).toFixed(2)
    ),
  }))

  return (
    <div
      className="probability-chart"
      style={{
        width: '100%',
        height: 320,
      }}
    >
      <ResponsiveContainer
        width="100%"
        height="100%"
      >
        <BarChart
          data={datosGrafico}
          margin={{
            top: 10,
            right: 20,
            left: 0,
            bottom: 10,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />

          <XAxis dataKey="nombre" />

          <YAxis
            domain={[0, 100]}
            tickFormatter={(valor) => `${valor}%`}
          />

          <Tooltip
            formatter={(valor) =>
              `${Number(valor).toFixed(2)}%`
            }
          />

          <Bar
            dataKey="similitud"
            name="Similitud"
            radius={[6, 6, 0, 0]}
          />

          <Bar
            dataKey="probabilidad"
            name="Probabilidad"
            radius={[6, 6, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default ProbabilityChart