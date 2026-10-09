// คำนวณยอดเงินจากรายการการเงิน (เงินเข้า/เงินออก) — คิดเป็นสตางค์เพื่อกันทศนิยมเพี้ยน
const toSatang = (amount) => {
  const value = Number(amount)
  return Number.isFinite(value) ? Math.round(value * 100) : 0
}

const isActive = (item) => item.status !== 'ยกเลิก'

/** รายการเงินออกที่ยังไม่ยกเลิก (ใช้คิดค่าใช้จ่ายรวม / รายโปรเจกต์) */
export const activeExpenses = (transactions = []) =>
  transactions.filter((item) => item.direction === 'out' && isActive(item))

export const sumAmount = (items = []) =>
  items.reduce((sum, item) => sum + toSatang(item.amount), 0) / 100

/**
 * สรุปยอด
 * - income   = เงินเข้าที่ไม่ยกเลิก
 * - expense  = เงินออกที่ไม่ยกเลิก (รวมรอเบิก)
 * - pending  = เงินออกสถานะ "รอเบิก" (ยังไม่ได้จ่ายออกจากกองกลาง)
 * - balance  = เงินคงเหลือจริง = income − (expense − pending)
 */
export function summarizeFinance(transactions = []) {
  let income = 0
  let expense = 0
  let pending = 0
  for (const item of transactions) {
    if (!isActive(item)) continue
    const amount = toSatang(item.amount)
    if (item.direction === 'in') income += amount
    else if (item.direction === 'out') {
      expense += amount
      if (item.status === 'รอเบิก') pending += amount
    }
  }
  return {
    income: income / 100,
    expense: expense / 100,
    pending: pending / 100,
    balance: (income - expense + pending) / 100,
    count: transactions.length,
  }
}
