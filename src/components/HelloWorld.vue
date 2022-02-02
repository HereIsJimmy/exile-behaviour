<template>
  <div class="hello">
    <h1>{{ msg }}</h1>
    <p>{{path}}</p>
    <div>
      <input type="file" @change="changedFile" />
    </div>
  </div>
</template>

<script>
const chokidar = require('chokidar')
const Diff = require('diff')
const fs = require('fs/promises')
import safeZones from '@/assets/safeZones.js'

export default {
  name: 'HelloWorld',
  props: {
    msg: String
  },
  data() {
    return {
      path: '',
      contents: null,
      parsedData: [],

      watcher: null,
    }
  },
  created() {
    this.watcher = chokidar.watch([], { persistent: true });
    this.watcher
      .on('ready', this.readfile)
      .on('change', this.readfile)
      .on('unlink', p => p + ' removed')
      .on('add', p => p + ' added')
  },
  methods: {
    changedFile(ev) {
      if (!ev.target.files.length)
        return

      const { path } = ev.target.files[0]
      if (path === this.path)
        return

      this.unwatchCurrent()
      this.$set(this, 'path', path)
      this.watcher.add(this.path)
    },
    unwatchCurrent() {
      this.watcher.unwatch(this.path)
    },
    async readfile() {
      const file = await fs.readFile(this.path, { encoding: 'utf8' })
      if (this.contents) {
        const diff = Diff.diffLines(this.contents, file)
        if (diff.some(it => it.removed)) {
          this.parseAllData(file)
        } else {
          const addedLines = diff.find(it => it.added)
          this.parseLines(addedLines)
        }
      } else {
        this.parseAllData(file)
      }
      this.contents = file
    },
    parseAllData(file) {
      this.$set(this, 'parsedData', this.parse(file))
      console.log([...this.parsedData])
      // const enteredHideout = this.parsedData.filter(it => it.hideout)
      // let time = 0
      // console.log('Time spent in hideout:', time)
    },
    parseLines(chunk) {
      const parsed = this.parse(chunk)
      this.parseData.push(...parsed)
      console.log([...parsed])
    },
    parse(fileData) {
      const split = fileData.split('\n')
      const filtered = split.filter(this.filterLine)
      return filtered.map(l => {
        const master = this.isMaster(l)
        const hideout = safeZones.some(zone => l.includes(zone))
        const zone = l.split('You have entered ')[1].replace('.', '').replace('\r', '')
        const [ date, time ] = l.split(' ').slice(0, 2)
        return { zone, date, time, hideout, master }
      })
    },
    filterLine(l) {
      return l.includes('You have entered')
    },
    isMaster() {
      return false
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
</style>
