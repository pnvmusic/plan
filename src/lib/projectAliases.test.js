import test from 'node:test'
import assert from 'node:assert/strict'

import { normalizeReportAliases } from './projectAliases.js'

test('normalizes report aliases by trimming blanks and removing case-insensitive duplicates', () => {
  assert.deepEqual(
    normalizeReportAliases(['  Acoustic Version  ', '', 'acoustic version', 'ชื่อจาก YouTube']),
    ['Acoustic Version', 'ชื่อจาก YouTube'],
  )
})

test('can include a pending alias when the form is saved without pressing add', () => {
  assert.deepEqual(
    normalizeReportAliases(['ชื่อเดิม'], '  ชื่อที่กำลังพิมพ์  '),
    ['ชื่อเดิม', 'ชื่อที่กำลังพิมพ์'],
  )
})
