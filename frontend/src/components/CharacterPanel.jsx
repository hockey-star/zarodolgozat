import React from 'react'
import { usePlayer } from '../context/PlayerContext.jsx'
import { DUMMY_ITEMS } from '../data/items.js'

export default function CharacterPanel(){
  const { player, levelUp, equipItem, unequipItem, addItem } = usePlayer() || {}

  if(!player) return <div className='bg-gray-900 p-4 rounded'>Nincs karakter. Hozz létre egyet.</div>

  // helper to equip first time sample items if none
  function ensureItems(){
    if((player.items||[]).length===0){
      DUMMY_ITEMS.forEach(it=> addItem({...it, equipped:false}))
    }
  }

  const stats = player.base

  return (
    <div className='p-4 border border-gray-800 rounded bg-gray-900'>
      <div className='flex gap-4'>
        <div className='w-48 p-2 border border-gray-800 rounded bg-black/20 flex items-center justify-center'>[Karakter sprite]</div>
        <div className='flex-1'>
          <div className='font-semibold text-lg'>{player.username} — {player.classId}</div>
          <div className='text-sm text-gray-400'>Szint: {player.level} • Arany: {player.gold}</div>
          <div className='mt-3 grid grid-cols-2 gap-2'>
            <div>HP: {stats.hp}</div>
            <div>STR: {stats.str}</div>
            <div>INT: {stats.int}</div>
            <div>AGI: {stats.agi}</div>
          </div>
          <div className='mt-3 flex gap-2'>
            <button className='btn' onClick={()=>{ levelUp(); }}>Szintlépés (+3 pont teszt)</button>
            <button className='btn' onClick={()=>ensureItems()}>Felszerzés feltöltése</button>
          </div>
        </div>
      </div>

      <div className='mt-4'>
        <div className='font-semibold'>Inventory</div>
        <div className='grid grid-cols-3 gap-2 mt-2'>
          {(player.items||[]).map(it => (
            <div key={it.id} className='p-2 border border-gray-800 rounded flex flex-col'>
              <div className='font-semibold'>{it.name}</div>
              <div className='text-xs text-gray-400'>Típus: {it.type}</div>
              <div className='mt-2 flex gap-2'>
                {!it.equipped ? <button className='btn' onClick={()=>equipItem(it.id)}>Equip</button> : <button className='btn' onClick={()=>unequipItem(it.id)}>Unequip</button>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
