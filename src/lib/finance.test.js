import test from 'node:test'
import assert from 'node:assert/strict'
import { summarizeFinance, activeExpenses, sumAmount } from './finance.js'

test('summarizeFinance calculates income, expense, pending and balance', () => {
  const summary = summarizeFinance([
    { direction: 'in', amount: 5000, status: 'ได้รับแล้ว' },
    { direction: 'in', amount: '1250.50', status: 'ได้รับแล้ว' },
    { direction: 'out', amount: 800, status: 'จ่ายแล้ว' },
    { direction: 'out', amount: 300, status: 'รอเบิก' },
  ])
  assert.deepEqual(summary, { income: 6250.5, expense: 1100, pending: 300, balance: 5450.5, count: 4 })
})

test('summarizeFinance ignores cancelled items', () => {
  const summary = summarizeFinance([
    { direction: 'in', amount: 1000, status: 'ยกเลิก' },
    { direction: 'out', amount: 500, status: 'ยกเลิก' },
    { direction: 'in', amount: 200, status: 'ได้รับแล้ว' },
  ])
  assert.deepEqual(summary, { income: 200, expense: 0, pending: 0, balance: 200, count: 3 })
})

test('summarizeFinance keeps currency exact to one satang', () => {
  const summary = summarizeFinance([
    { direction: 'in', amount: '0.10', status: 'ได้รับแล้ว' },
    { direction: 'in', amount: '0.20', status: 'ได้รับแล้ว' },
    { direction: 'out', amount: '0.01', status: 'เบิกแล้ว' },
  ])
  assert.equal(summary.income, 0.3)
  assert.equal(summary.balance, 0.29)
})

test('summarizeFinance ignores malformed amounts', () => {
  const summary = summarizeFinance([
    { direction: 'in', amount: '', status: 'ได้รับแล้ว' },
    { direction: 'out', amount: 'not-a-number', status: 'จ่ายแล้ว' },
  ])
  assert.deepEqual(summary, { income: 0, expense: 0, pending: 0, balance: 0, count: 2 })
})

test('activeExpenses keeps only non-cancelled outgoing items', () => {
  const rows = activeExpenses([
    { direction: 'out', amount: 100, status: 'จ่ายแล้ว' },
    { direction: 'out', amount: 50, status: 'ยกเลิก' },
    { direction: 'in', amount: 999, status: 'ได้รับแล้ว' },
  ])
  assert.equal(rows.length, 1)
  assert.equal(sumAmount(rows), 100)
})
