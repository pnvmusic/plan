import test from 'node:test'
import assert from 'node:assert/strict'
import { summarizeFundTransactions } from './fund.js'

test('summarizeFundTransactions calculates income, withdrawals, and balance', () => {
  const summary = summarizeFundTransactions([
    { direction: 'in', amount: 5000 },
    { direction: 'in', amount: '1250.50' },
    { direction: 'out', amount: 800 },
  ])

  assert.deepEqual(summary, {
    income: 6250.5,
    withdrawals: 800,
    balance: 5450.5,
    count: 3,
  })
})

test('summarizeFundTransactions keeps currency exact to one satang', () => {
  const summary = summarizeFundTransactions([
    { direction: 'in', amount: '0.10' },
    { direction: 'in', amount: '0.20' },
    { direction: 'out', amount: '0.01' },
  ])

  assert.deepEqual(summary, {
    income: 0.3,
    withdrawals: 0.01,
    balance: 0.29,
    count: 3,
  })
})

test('summarizeFundTransactions ignores malformed amounts', () => {
  const summary = summarizeFundTransactions([
    { direction: 'in', amount: '' },
    { direction: 'out', amount: 'not-a-number' },
  ])

  assert.deepEqual(summary, {
    income: 0,
    withdrawals: 0,
    balance: 0,
    count: 2,
  })
})
