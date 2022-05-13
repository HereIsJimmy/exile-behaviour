<template>
  <div>
    <canvas ref="chart" />
  </div>
</template>

<script>
import { avg, min, max } from '@/utils/collections.js'
import { Chart } from 'chart.js'
import { groupBy } from 'lodash'

export default {
  name: 'SessionChart',
  props: {
    session: { type: Array }
  },
  data() {
    return {
      chart: null
    }
  },
  computed: {
    config() {
      const grouped = groupBy(this.session, 'zone')
      const labels = Object.keys(grouped)
      const datasets = [
        { fn: avg, color: 'blue', title: 'Duración Media' },
        { fn: min, color: 'green', title: 'Duración Mínima' },
        { fn: max, color: 'red', title: 'Duración Máxima' }
      ]
      const data = {
        labels: labels,
        datasets: datasets.map(({ fn, color, title }) => ({
          label: title,
          backgroundColor: color,
          borderColor: color,
          data: labels.map(map => fn(grouped[map].map(it => it.duration)))
        }))
      }

      return {
        type: 'bar',
        data: data,
        options: {
          plugins: {
            legend: {
              display: true,
              position: 'bottom',
              align: 'center',
              title: {
                display: true
              }
            }
          }
        }
      };
    }
  },
  watch: {
    session() {
      this.renderChart()
    }
  },
  methods: {
    renderChart() {
      const el = this.$refs.chart
      if (!el) return
      if (this.chart) this.chart.destroy()
      this.chart = new Chart(el, this.config)
    }
  },
  mounted() {
    this.renderChart()
  }
}
</script>

<style lang='scss' scoped>
</style>