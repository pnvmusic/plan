const toSatang = (amount) => {
  const value = Number(amount)
  return Number.isFinite(value) ? Math.round(value * 100) : 0
}

export function summarizeFundTransactions(transactions = []) {
  const incomeSatang = transactions
    .filter((item) => item.direction === 'in')
    .reduce((sum, item) => sum + toSatang(item.amount), 0)
  const withdrawalSatang = transactions
    .filter((item) => item.direction === 'out')
    .reduce((sum, item) => sum + toSatang(item.amount), 0)

  return {
    income: incomeSatang / 100,
    withdrawals: withdrawalSatang / 100,
    balance: (incomeSatang - withdrawalSatang) / 100,
    count: transactions.length,
  }
}
