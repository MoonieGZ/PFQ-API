export function areSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getUTCFullYear() === date2.getUTCFullYear() &&
      date1.getUTCMonth() === date2.getUTCMonth() &&
      date1.getUTCDate() === date2.getUTCDate()
  )
}

export function isBirthdayBonus(dob: Date): boolean {
  const currentDate = new Date()
  const differenceInTime = currentDate.getTime() - dob.getTime()
  const differenceInDays = differenceInTime / (1000 * 3600 * 24)
  return differenceInDays >= 0 && differenceInDays <= 7
}