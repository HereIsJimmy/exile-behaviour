<template>
  <div class="hello">
    <h1>Exile Behaviour</h1>
    
    <div class="mt-4 mb-3">
      <label for="file-upload" class="file-upload no-select" style="width: 300px; display: inline-block">
        Select Client.txt
      </label>
      <input id="file-upload" type="file" style="display: none"  @change="changedFile" />
    </div>
    <div class="mt-4 mb-4 no-select">
      <label class="pointer">
        <input type="radio" name="mode" :value="0" v-model="mode"> 
        Live
      </label>
      <label class="pointer">
        <input type="radio" name="mode" :value="1" v-model="mode"> 
        Select Session
      </label>
      <label class="pointer">
        <input type="radio" name="mode" :value="2" v-model="mode"> 
        Filter by Date
      </label>
    </div>

    <div v-if="loading" class="mt-4 mb-4 text-center">Cargando</div>
    <template v-if="mode===0">
      Live
    </template>

    <template v-if="mode===1">
      <div v-if="gameSessions.length && !session" class="flex-grid-row-wrap-center game-sessions" style="width: 80%;margin: auto;">
        <div
          v-for="(session) in gameSessions"
          :key="`${session[0]}_${session[1]}`"
          class="flex-static p-2"
          style="flex-basis: 20%"
          @click="selectSession(session)"
        >
          <div class="grid button">
            <div class="text-left"><strong>From</strong>:</div>
            <div class="text-left ws-nowrap">{{ getDateTimeFromTimestamp(session[0]) }}</div>
            <div class="text-left"><strong>To</strong>:</div>
            <div class="text-left ws-nowrap">{{ getDateTimeFromTimestamp(session[1]) }}</div>
          </div>
        </div>
      </div>
      <div v-else-if="session">
        <div class="flex-grid-row flex-evenly">
          <div class="flex-shrink">
            <div class="button" @click="session=null">Back</div>
          </div>
          <div class="flex-shrink">
            <div class="text-center">
              <strong>From</strong>: {{ getDateTimeFromTimestamp(session[0]) }}
            </div>
            <div class="text-center">
              <strong>To</strong>: {{ getDateTimeFromTimestamp(session[1]) }}
            </div>
          </div>
        </div>
        <div class="flex-row-gap1 flex-center mt-4">
          <h3 class="flex-shrink valign-center" style="margin: 0">Session Data:</h3>
          <div
            class="flex-shrink"
            :class="{ 'button-active': onlyMaps, 'button-default': !onlyMaps }"
            @click="onlyMaps=!onlyMaps"
          >
            Show Only Maps
          </div>
        </div>
        <div class="mt-3">
          <div class="p-4">
            <div v-if="entries.length" style="margin: auto; max-width: 1000px">
              <SessionStats :session="entries" style="margin-left: 4em" />
              <SessionChart :session="entries" class="mt-4" />
            </div>
            <div v-else-if="onlyMaps && zoneEntries.length">
              No maps were ran this session
            </div>
            <div v-else>
              No data for this session
            </div>
          </div>
          <!-- <div
            v-for="(data,i) in zoneEntries"
            :key="i"
            class="flex-row"
          >
            <div class="flex-half-static text-right pr-4">{{ getTimeStr(data.timestamp) }}</div>
            <div class="flex-half-static text-left pl-4">
              <strong>{{ data.zone }}</strong> 
              [{{ data.level }}] - Seed {{ data.seed }}
              <div v-if="!data.hideout">
                <div v-for="(s, i) in data.sessions" :key="`${data.zoneId}_${data.seed}_time_${i}`">
                  Entered @ {{ getTimeStr(s.entered) }} <template v-if="s.enteredFrom">from {{ combined[s.enteredFrom].zone }} ({{ combined[s.enteredFrom].seed }})</template><br/>
                  Left @ {{ getTimeStr(s.left) }} <template v-if="s.leftTo">to {{ combined[s.leftTo].zone }} ({{ combined[s.leftTo].seed }})</template>
                </div>
              </div>
            </div>
          </div> -->
        </div>
      </div>
      <div v-else class="text-muted">
        Load a filled / valid <b>Client.txt</b> file
      </div>
    </template>

    <template v-if="mode===2">
      <div class="mb-3">
        Start: 
        <Datepicker
          :disabled="!parsedData.length"
          :options="datepickerConfig"
          @changed="setStart"
        />
      </div>
      <div class="mb-3">
        End: 
        <Datepicker
          :disabled="!start"
          :options="datepickerConfigEnd"
          @changed="setEnd"
        />
      </div>
    </template>

  </div>
</template>

<script>
// const fs = require('fs').promises
// const chokidar = require('chokidar')
// const Diff = require('diff')
import safeZones from '@/assets/safeZones.js'
import Datepicker from '@/components/Datepicker.vue'
import SessionChart from '@/components/SessionChart.vue'
import SessionStats from '@/components/SessionStats.vue'

function addZero(n) {
  return `${n < 10 ? '0' : ''}${n}`
}

const GENERATE_ZONE = '11869'
const ZONE = 'cff94'
const CONNECTING = '890da'
// const STARTUP = '951bc'

// Start with "GameSessions"
// Which GameSession do you wanna analyze?
// Show time that starts from login/hideout entrance after login
// to last hideout entrance.
// When they select the GameSession, filter all the rest.

export default {
  name: 'HelloWorld',
  components: {
    Datepicker,
    SessionChart,
    SessionStats
  },
  props: {
    msg: String
  },
  data() {
    return {
      path: '',
      start: null,
      end: null,
      session: null,
      loading: false,
      onlyMaps: false,
      ignoreCampaign: true,
      initString: 'Window Start',
      loginString: 'Async connecting to',
      zoneChangeString: 'You have entered',
      slainString: 'has been slain',
      contents: [],
      parsedData: [],
      mode: 1,
      campaignRegex: /(\d)+_(\d)+_(.)+/,
                        // Generating level 60 area "HideoutPrimevalRuins" with seed 1
      generateAreaRegex: /\w+ \w+ (\d+) \w+ ("\w+") \w+ \w+ (.+)/,
      dates: [],
      clientRegex: /(\[)(\w+)+ (Client) (\d)+(\]) /,
      limitOfflineBetweenLogins: 15 * 60 * 1000,
      watcher: null,
    }
  },
  computed: {
    datepickerConfig() {
      const logins = this.gameSessions
      const minDate = logins.length ? logins[0][0] : null
      const maxDate = logins.length > 1 ? logins[logins.length - 1][1] : null
      return {
        minDate,
        maxDate,
        enableTime: true,
      }
    },
    datepickerConfigEnd() {
      return {
        ...this.datepickerConfig,
        minDate: this.start,
      }
    },

    gameSessions () {
      const sessions = {}
      this.parsedData
        .filter(it => it.hideout)
        .forEach(it => {
          if (!it.lastLogin)
            return

          const sessionStarts = Object.keys(sessions)
          const closeEnoughSession = sessionStarts.find(start =>
            sessions[start] >= it.lastLogin - this.limitOfflineBetweenLogins
          )
          
          sessions[~closeEnoughSession ? it.lastLogin : closeEnoughSession] = it.timestamp
        })

      return Object.keys(sessions)
        .sort((a, b) => a < b ? -1 : 1)
        .map(ts => [+ts, sessions[ts], (sessions[ts]-+ts)/(60 * 1000)])
        .filter(it => it[2] > 30)
    },
    sessionData() {
      return this.parsedData.filter(it => it.timestamp >= this.session[0] && it.timestamp <= this.session[1])
    },
    combined() {
      if (this.sessionData.length) {
        const areas = {}
        let areaEntered = null
        for (const it of this.sessionData) {
          if (it.type === GENERATE_ZONE && (areaEntered?.seed !== it.seed || areaEntered.zoneId !== it.zoneId)) {
            if (areaEntered) {
              areaEntered.times.push({ timestamp: it.timestamp, leaving: true, to: { zone: it.zoneId, seed: it.seed } })
            }
            const fromZoneId = areaEntered?.zoneId
            const fromSeed = areaEntered?.seed
            const key = it.zoneId + '_' + it.seed

            areaEntered = areas[key] || { ...it, entries: [], times: [] }
            areas[key] = areaEntered
            areaEntered.times.push({ timestamp: it.timestamp, entering: true, from: { zone: fromZoneId, seed: fromSeed } })
          } else if (it.type === ZONE) {
            if (!areaEntered || it.slain) continue
            areaEntered.entries.push(it)
            areaEntered.zone = it.zone
          }
        }
        Object.values(areas).forEach(area => {
          const sessions = []
          let last = null
          area.times.forEach(t => {
            if (last) {
              sessions.push({
                entered: last.timestamp,
                left: t.timestamp,
                enteredFrom: last.from?.zone ? `${last.from.zone}_${last.from.seed}` : null,
                leftTo: t.to?.zone ? `${t.to.zone}_${t.to.seed}` : null,
              })
              last = null
            } else {
              last = t
            }
          })
          area.sessions = sessions
          area.duration = sessions.reduce((sum, s) =>  sum + (s.left - s.entered) / (60 * 1000), 0) 
        })
        return areas// .filter(it => this.ignoreCampaign ? !it.campaign : true)
      } else {
        return []
      }
    },
    zoneEntries() {
      return Object.values(this.combined)
    },
    mapEntries() {
      return Object.values(this.combined).filter(it => it.map && !it.hideout)
    },
    entries() {
      return this.onlyMaps ? this.mapEntries : this.zoneEntries
    }
  },
  created() {
    // this.watcher = chokidar.watch([], { persistent: true });
    // this.watcher
    //   .on('ready', this.readfile)
    //   .on('change', this.readfile)
    //   .on('unlink', p => p + ' removed')
    //   .on('add', p => p + ' added')
  },
  methods: {
    async changedFile(ev) {
      if (!ev.target.files.length)
        return

      const { path } = ev.target.files[0]
      if (path === this.path)
        return

      // this.unwatchCurrent()
      this.$set(this, 'contents', [])
      this.$set(this, 'path', path)
      this.readFile(ev)
      // this.watcher.add(this.path)
    },
    selectSession(session) {
      this.session = session
    },
    setStart(date) {
      return this.start = this.getDateTimeFromTimestamp(date)
    },
    setEnd(date) {
      return this.end = this.getDateTimeFromTimestamp(date)
    },
    unwatchCurrent() {
      this.watcher.unwatch(this.path)
    },
    async readFile(ev) {
      const contents = await ev.target.files[0].text()
      this.$set(this, 'contents', contents)
      this.parseAllData(contents)
    },
    // async readfile() {
    //   try {
    //     this.loading = true
    //     const file = await fs.readFile(this.path, { encoding: 'utf8' })
    //     this.loading = false
    //     console.log(this.contents)
    //     console.log('donete', this.path, file)
    //     if (this.contents.length) {
    //       const diff = Diff.diffLines(this.contents, file)
    //       if (diff.some(it => it.removed)) {
    //         this.parseAllData(file)
    //       } else {
    //         const addedLines = diff.find(it => it.added)
    //         this.parseLines(addedLines)
    //       }
    //     } else {
    //       this.parseAllData(file)
    //     }
    //     this.$set(this, 'contents', file)
    //   } catch (err) {
    //     console.error(err)
    //   }
    // },
    parseAllData(file) {
      this.$set(this, 'parsedData', this.parse(file))
      this.computeTimeSpent()
    },

    parseLines(chunk) {
      const parsed = this.parse(chunk)
      this.parseData.push(...parsed)
    },
    parse(fileData) {
      const split = fileData.split('\n')
      const filtered = split
        .map(this.getLineInfo)
        .filter(this.filterLine)

      console.log(filtered)
      let lastIsHideout = null
      let lastLogin = null

      return filtered
        .map(l => {
          const timestamp = this.extractDateTime(l)
          const message = l.message
          if (l.type === CONNECTING) {
            lastLogin = timestamp
            return null
          } else if (l.type === ZONE) {
            const enteringZone = l.data.entering
            const master = l.data.master
            const hideout = safeZones.includes(l.data.zone)
            const zone = l.data.zone
            const slain = l.data.slain
            const side = enteringZone && !hideout && !lastIsHideout
            lastIsHideout = hideout
            return { type: l.type, zone, timestamp, hideout, master, side, lastLogin, slain, message }
          } else if (l.type === GENERATE_ZONE) {
            return { ...l.data, type: l.type, timestamp, message }
          }
        })
        .filter(it => it)
    },

    getDateTimeFromTimestamp(ts) {
      const date = new Date(ts)
      const d = addZero(date.getDate())
      const m = addZero(date.getMonth() + 1)
      const y = date.getFullYear()
      const hh = addZero(date.getHours())
      const mm = addZero(date.getMinutes())
      return `${y}-${m}-${d}T${hh}:${mm}`
    },
    getTimeStr(ts) {
      const date = new Date(ts)
      // const d = addZero(date.getDate())
      // const m = addZero(date.getMonth() + 1)
      // const y = date.getFullYear()
      const hh = addZero(date.getHours())
      const mm = addZero(date.getMinutes())
      return `${hh}:${mm}`
    },
    getTimestampFromDateTime(date, time) {
      const [year, month, day] = date.split('/')
      const [hour, min, sec] = time.split(':')
      return (new Date(year, month, day, hour, min, sec)).getTime()
    },
    extractDateTime(l) {
      return this.getTimestampFromDateTime(l.date, l.time)
    },
    extractZone(l) {
      return l.split(this.zoneChangeString + ' ')[1].replace('.', '').replace('\r', '')
    },
    enteringZone(l) {
      return l.includes(this.zoneChangeString)
    },
    filterLine(l) {
      return l && (
        l.type === ZONE && l.data.entered ||
        l.type === ZONE && l.data.slain ||
        l.type === ZONE && l.data.master ||
        l.type === GENERATE_ZONE ||
        l.type === CONNECTING
      )
    },
    isLogin(l) {
      return l.includes(this.loginString)
    },
    isMaster() {
      return false
    },
    getMaster() {
      return null
    },
    getType(t) {
      return t.slice(0, 5)
    },
    getLineInfo(l) {
      try {
        const [date, time, id, t, ...rest] = l.split(' ')
        const type = this.getType(t)
        const message = rest.join(' ').replace(this.clientRegex, '').replace('\r', '')
        const data = this.getTypeInfo(type, message)
        return { date, time, id, type, data, message }
      } catch (err) {
        return null
      }
    },
    getTypeInfo(type, message) {
      switch (type) {
        case GENERATE_ZONE: return this.getEnterAreaInfo(message);
        case ZONE: return this.getZONEInfo(message);
        default: return null
      }
    },
    getEnterAreaInfo(message) {
      const match = message.match(this.generateAreaRegex)
      if (match) {
        const [, level, zoneId, seed] = match
        const campaignCheck = zoneId.match(this.campaignRegex)
        return {
          level,
          zoneId: zoneId.replace(/'*"*/g, ''),
          seed,
          map: zoneId.includes('Map'),
          hideout: zoneId.includes('Hideout') || zoneId.includes('_town'),
          campaign: !!campaignCheck
        }
      } else {
        return {}
      }
    },
    getZONEInfo(message) {
      const entered = message.includes(this.zoneChangeString)
      return {
        entered,
        slain: message.includes(this.slainString),
        master: this.getMaster(message),
        zone: entered ? this.extractZone(message) : null
      }
    },
    computeTimeSpent() {
      const enteredMap = this.parsedData.filter(it => it.type === ZONE && !(it.hideout || it.side))
      const getNextHideout = (index) => {
        for (let i=index; i<this.parsedData.length; i++) {
          const it = this.parsedData[i]
          if (it.hideout) return i
        }
        return null
      }
      const getSizeZones = (index, nextHideout) => {
        const sideZones = []
        for (let i=index; i<nextHideout; i++) {
          const it = this.parsedData[i]
          if (it.side) sideZones.push(i)
        }
        return null
      }
      const mapsInfo = enteredMap
        .map((data, zoneIndex) => {
          const { timestamp } = data
          const nextHideout = getNextHideout(zoneIndex)
          const sideZones = getSizeZones(zoneIndex, nextHideout)
          return {
            sideZones,
            entered: timestamp,
            left: this.parsedData[nextHideout]?.timestamp
          }
        })
        .filter(it => it)

      const timeInMaps = mapsInfo.reduce((acc, it) => {
        if (!it.left) return acc
        return acc + (it.entered - it.left)
      }, 0)

      console.log('Time spent in maps:', Math.trunc(timeInMaps / (60 * 1000)), 'min')

      let enteredHideoutAt = 0
      const timeInHideouts = mapsInfo.reduce((acc, it) => {
        if (!it.left) return acc

        const enteredAt = it.entered
        const diff = enteredAt - enteredHideoutAt
        enteredHideoutAt = it.left
        return acc + diff
      }, 0)
      console.log('Time spent in hideout:', Math.trunc(timeInHideouts / (60 * 1000)), 'min')
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
h3 {
  margin: 40px 0 0;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}
.game-sessions .grid {
  grid-template-columns: 100px auto;
}
</style>
