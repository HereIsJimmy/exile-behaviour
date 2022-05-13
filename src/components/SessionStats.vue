<template>
  <div class="session-stats text-left">
    <div class="text-right bold pr-2">Session duration: </div>
    <div>{{ formatDuration(duration) }}</div>
    <div class="text-right bold pr-2">Average map: </div>
    <div>{{ formatDuration(average) }}</div>
    <div class="text-right bold pr-2">Shortest map: </div>
    <div>{{ formatDuration(shortest.duration) }} ({{ shortest.zone }})</div>
    <div class="text-right bold pr-2">Longest map: </div>
    <div>{{ formatDuration(longest.duration) }} ({{ longest.zone }})</div>

    <!-- <div class="flex-row flex-center">
      <div class="bold">Session duration: </div>
      <div>{{ formatDuration(duration) }}</div>
    </div>

    <div class="flex-row flex-center">
      <div class="bold">Average map: </div>
      <div>{{ formatDuration(average) }}</div>
    </div>

    <div class="flex-row flex-center">
      <div class="bold">Shortest map: </div>
      <div>{{ formatDuration(shortest.duration) }} ({{ shortest.zone }})</div>
    </div>
  
    <div class="flex-row flex-center">
      <div class="bold">Longest map: </div>
      <div>{{ formatDuration(longest.duration) }} ({{ longest.zone }})</div>
    </div> -->
  </div>
</template>

<script>
import { sumField, avgField } from '@/utils/collections.js'

export default {
  name: 'SessionStats',
  props: { session: { type: Array } },
  data() {
    return {}
  },
  computed: {
    duration() {
      return sumField(this.session, 'duration')
    },
    average() {
      return avgField(this.session, 'duration')
    },
    shortest() {
      let shortest = null
      this.session.forEach(m => {
        if (!shortest || m.duration < shortest.duration)
          shortest = m
      })
      return shortest
    },
    longest() {
      let longest = null
      this.session.forEach(m => {
        if (!longest || m.duration > longest.duration)
          longest = m
      })
      return longest
    },
  },
  methods: {
    formatDuration(time) {
      const dur = Math.round(time)
      const h = Math.trunc(dur / 60)
      const min = dur % 60
      let duration = `${min}min.`
      if (h > 0) duration = `${h}h. ` + duration
      return duration
    }
  },
}
</script>

<style lang='scss' scoped>
.session-stats {
  display: grid;
  grid-template-columns: auto auto;
  gap: 5px;
  // & > div > div:first-child {
  //   width: 200px;
  //   flex: 0 0 200px;
  // }
  // & > div > div:last-child {
  //   width: 300px;
  //   flex: 0 0 300px;
  // }
}
</style>