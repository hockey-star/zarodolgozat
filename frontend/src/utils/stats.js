export function applyItemsToStats(base, items){
  const stats = { ...base }
  (items||[]).forEach(it=>{
    const b = it.bonus || {}
    if(b.hp) stats.hp += b.hp
    if(b.str) stats.str += b.str
    if(b.int) stats.int += b.int
    if(b.agi) stats.agi += b.agi
  })
  return stats
}

export function aggregateBonuses(items){
  const bonus = { hp:0, str:0, int:0, agi:0 }
  (items||[]).forEach(it=>{
    const b = it.bonus || {}
    bonus.hp += b.hp || 0
    bonus.str += b.str || 0
    bonus.int += b.int || 0
    bonus.agi += b.agi || 0
  })
  return bonus
}
