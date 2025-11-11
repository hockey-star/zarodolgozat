import React, { createContext, useContext, useEffect, useState } from 'react'
import { DEFAULT_CLASSES } from '../data/classes.js'

const PlayerContext = createContext(null)
export function usePlayer(){ return useContext(PlayerContext) }

const STORAGE = 'sk_v3_save'

export function PlayerProvider({ children }){
  const [player, setPlayer] = useState(()=>{
    try{ const raw = localStorage.getItem(STORAGE); return raw? JSON.parse(raw).player : null }catch(e){ return null }
  })

  useEffect(()=>{
    localStorage.setItem(STORAGE, JSON.stringify({ player }))
  }, [player])

  function createCharacter(username, classId){
    const cls = DEFAULT_CLASSES.find(c=>c.id===classId)
    const base = { ...cls.base }
    const created = { username, classId, level:1, xp:0, gold:100, base, hp: base.hp, items: [], statPoints:0 }
    setPlayer(created)
  }

  function levelUp(){
    setPlayer(p=>{
      if(!p) return p
      const gained = 3
      return { ...p, level: p.level+1, statPoints: (p.statPoints||0)+gained }
    })
  }

  function equipItem(itemId){
    setPlayer(p=>{
      if(!p) return p
      if((p.items||[]).some(i=>i.id===itemId && i.equipped)) return p
      const items = (p.items||[]).map(i=> i.id===itemId ? { ...i, equipped:true } : i)
      return { ...p, items }
    })
  }

  function unequipItem(itemId){
    setPlayer(p=>{
      if(!p) return p
      const items = (p.items||[]).map(i=> i.id===itemId ? { ...i, equipped:false } : i)
      return { ...p, items }
    })
  }

  function addItem(item){
    setPlayer(p=>{
      if(!p) return p
      return { ...p, items: [...(p.items||[]), item] }
    })
  }
  

  return <PlayerContext.Provider value={{ player, createCharacter, levelUp, equipItem, unequipItem, addItem, setPlayer }}>{children}</PlayerContext.Provider>
}
