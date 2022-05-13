
import { get } from 'lodash'

export const sum = data => data.reduce((sum, it) =>  sum + it, 0)
export const avg = data => sum(data) / data.length
export const min = data => Math.min(...data.map(it => it))
export const max = data => Math.max(...data.map(it => it))

export const sumField = (data, field) => data.reduce((sum, it) =>  sum + get(it, field), 0)
export const avgField = (data, field) => sumField(data, field) / data.length
export const minField = (data, field) => Math.min(...data.map(it => get(it, field)))
export const maxField = (data, field) => Math.max(...data.map(it => get(it, field)))