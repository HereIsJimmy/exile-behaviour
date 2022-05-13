import Vue from 'vue'
import App from './App.vue'

import '@/assets/style/margins.scss'
import '@/assets/style/text.scss'
import '@/assets/style/form.scss'
import '@/assets/style/flex.scss'
import '@/assets/style/grid.scss'
import '@/assets/style/box.scss'
import 'vue-awesome/icons/calendar'

import Icon from 'vue-awesome/components/Icon'
Vue.component('Icon', Icon)

Vue.config.productionTip = false
new Vue({
  render: h => h(App),
}).$mount('#app')

// CharJS registerables
import {
  Chart, Legend,
  LineController, BarController,
  CategoryScale, LinearScale,
  PointElement, LineElement, BarElement
} from 'chart.js'

Chart.register(
  Legend,
  LineController, BarController,
  CategoryScale, LinearScale,
  PointElement, LineElement, BarElement
)
