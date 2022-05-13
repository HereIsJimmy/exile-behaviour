<template>
  <div
    class="datepicker no-select"
    style="position: relative"
    @click="picker.open()"
  >
    <span class="calendar-icon text-muted">
      <icon name="calendar" />
    </span>
    <input
      :disabled="disabled"
      data-input
      :placeholder="placeholder"
      :ref="pickerId"
      :name="pickerId"
      :id="pickerId"
      v-model="value"
      type="text"
    />
  </div>
</template>

<script>
import picker from 'flatpickr/dist/flatpickr.js'
import 'flatpickr/dist/flatpickr.min.css'
import 'flatpickr/dist/themes/material_green.css'

export default {
  name: 'Datepicker',
  props: {
    options: { type: Object },
    disabled: { type: Boolean },
    placeholder: { type: String, default: 'YYYY-MM-DD' },
  },
  data() {
    return {
      picker: null,
      value: ""
    }
  },
  computed: {
    pickerId() {
      return 'pickerId' + Math.random()
    },
  },
  methods: {
    handleClear() {
      this.picker && this.picker.clear()
    },
    changedDate(dates) {
      if (!dates.length) return false

      if (this.multiple && dates.length > 1) {
        this.$emit('changed', { begin: +dates[0], end: +dates[1] })
      } else if (!this.multiple) {
        this.$emit('changed', +dates[0])
      }
      return true
    },
  },
  watch: {
    options(opts) {
      if (opts.defaultDate) {
        let defaultDate = opts.multiple
          ? opts.defaultDate.join(' ')
          : opts.defaultDate
        this.picker.setDate(defaultDate)

        if (!this.value) {
          this.value = defaultDate
        }
      }
      if (opts.maxDate) {
        this.picker.set('maxDate', opts.maxDate)
      }
      if (opts.minDate) {
        this.picker.set('minDate', opts.minDate)
      }
    },
  },
  mounted() {
    const el = this.$refs[this.pickerId]
    let opts = this.options
    if (this.options.defaultDate && !this.value) {
      this.value = this.options.defaultDate
    }
    this.picker = new picker(el, opts)
    this.picker.config.onChange.push(this.changedDate)
  },
  beforeDestroy() {
    if (this.picker) {
      this.picker.destroy()
      this.picker = null
    }
  },
}
</script>

<style lang='scss'>

.datepicker {
  display: inline-block;
  .calendar-icon {
    position: absolute;
    right: 12px;
    top: 10px;
    cursor: pointer;
  }
  .datepicker input.slick {
    background-color: transparent !important;
    box-shadow: none;
    border: none;
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
    &:hover {
      background-color: rgba(0, 0, 0, 0.05) !important;
      &:focus {
        background-color: rgba(0, 0, 0, 0.03) !important;
      }
    }
    &.active {
      background-color: rgba(0, 0, 0, 0.03) !important;
    }
  }
}
</style>