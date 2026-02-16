'use client'

import { useEffect, useState } from 'react'
import styles from '../products-list.module.css'
import { useAuth } from '../../../../contexts/AuthContext'
import Link from 'next/link'

interface RatedProduct {
  id: number
  name: string
  avgRating: number
  reviewCount: number
}

export default function HighestRatedPage() {
  const { token } = useAuth()
  const [items, setItems] = useState<RatedProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchRated() {
      try {
        const res = await fetch('/api/admin/products/highest-rated', {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) throw new Error((await res.json()).error || 'Failed')
        const data = await res.json()
        setItems(data.products || [])
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchRated()
  }, [token])

  if (loading) return <p style={{ padding: '1rem' }}>Loading…</p>
  if (error) return <p style={{ padding: '1rem', color: 'red' }}>{error}</p>

  return (
    <main style={{ padding: '2rem' }}>
      <h1 style={{ marginBottom: '1rem' }}>Highest-rated Products</h1>
      {items.length === 0 ? (
        <p>No ratings yet.</p>
      ) : (
        <table className={styles.productTable} style={{ minWidth: '400px' }}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Avg ★</th>
              <th># Reviews</th>
            </tr>
          </thead>
          <tbody>
            {items.map((p) => (
              <tr key={p.id}>
                <td>{p.name}</td>
                <td>{p.avgRating ? p.avgRating.toFixed(1) : 'N/A'}</td>
                <td>{p.reviewCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  )
} 