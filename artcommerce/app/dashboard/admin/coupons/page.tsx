'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '../../../contexts/AuthContext'

export default function CouponManager() {
  const { token, user } = useAuth()
  const [coupons, setCoupons] = useState<any[]>([])
  const [form, setForm] = useState({ code:'', type:'percentage', amount:0, expiresAt:'', usageLimit:'' })

  // 1️⃣ Load
  useEffect(() => {
    if (user?.role !== 'admin') return
    fetch('/api/admin/coupons').then(r=>r.json()).then(j=>setCoupons(j.coupons))
  }, [user])

  // 2️⃣ Create
  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    const body = {
      ...form,
      amount: Number(form.amount),
      expiresAt: form.expiresAt,
      usageLimit: form.usageLimit ? Number(form.usageLimit) : null
    }
    const res = await fetch('/api/admin/coupons', {
      method:'POST',
      headers:{'Content-Type':'application/json', Authorization:`Bearer ${token}`},
      body: JSON.stringify(body)
    })
    const j = await res.json()
    if (res.ok) setCoupons([j.coupon, ...coupons])
  }

  // 3️⃣ Update & Delete (inline)
  async function updateField(id:number, field:string, val:any){
    const res = await fetch('/api/admin/coupons', {
      method:'PATCH',
      headers:{'Content-Type':'application/json', Authorization:`Bearer ${token}`},
      body: JSON.stringify({ id, [field]: val })
    })
    if (res.ok) {
      const { coupon } = await res.json()
      setCoupons(coupons.map(c=>c.id===coupon.id?coupon:c))
    }
  }
  async function deleteOne(id:number){
    if (!confirm('Delete?')) return
    const res = await fetch('/api/admin/coupons', {
      method:'DELETE',
      headers:{'Content-Type':'application/json', Authorization:`Bearer ${token}`},
      body: JSON.stringify({ id })
    })
    if (res.ok) setCoupons(coupons.filter(c=>c.id!==id))
  }

  if (user?.role !== 'admin') return <p>Unauthorized</p>

  return (
    <main className="p-8">
      <h1 className="text-2xl mb-4">Coupon Manager</h1>
      <form onSubmit={handleCreate} className="space-x-2 mb-6">
        <input placeholder="Code" value={form.code} onChange={e=>setForm({...form,code:e.target.value})}/>
        <select value={form.type} onChange={e=>setForm({...form,type:e.target.value})}>
          <option value="percentage">Percentage</option>
          <option value="flat">Flat</option>
        </select>
        <input type="number" placeholder="Amt" value={form.amount} onChange={e=>setForm({...form,amount: e.target.value})}/>
        <input type="date" value={form.expiresAt} onChange={e=>setForm({...form,expiresAt:e.target.value})}/>
        <input type="number" placeholder="Limit" value={form.usageLimit} onChange={e=>setForm({...form,usageLimit:e.target.value})}/>
        <button type="submit" className="bg-green-600 text-white px-2 rounded">Create</button>
      </form>

      <table className="w-full border">
        <thead><tr>
          {['Code','Type','Amt','Expires','Used/Limit','Actions'].map(h=>(
            <th key={h} className="border px-2">{h}</th>
          ))}
        </tr></thead>
        <tbody>
          {coupons.map(c=>(
            <tr key={c.id}>
              <td className="border px-2">{c.code}</td>
              <td className="border px-2">{c.type}</td>
              <td className="border px-2">{c.amount}</td>
              <td className="border px-2">{new Date(c.expiresAt).toLocaleDateString()}</td>
              <td className="border px-2">{c.usedCount}/{c.usageLimit||'∞'}</td>
              <td className="border px-2 space-x-2">
                <button onClick={()=>deleteOne(c.id)} className="text-red-600">Delete</button>
                {/* you could add inline edit UI here */}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  )
}