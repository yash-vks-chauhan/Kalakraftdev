'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '../../../contexts/AuthContext'
import Link from 'next/link'

interface RatedProduct {
  id: number
  name: string
  avgRating: number
  reviewCount: number
}
interface Review {
  id: number
  rating: number
  comment?: string
  createdAt: string
  adminReply?: string
  adminReaction?: string
  product: { id: number; name: string }
  user: { id: string; fullName: string }
}

export default function ReviewsDashboard() {
  const { token } = useAuth()

  const [topProducts, setTopProducts] = useState<RatedProduct[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const [pRes, rRes] = await Promise.all([
          fetch('/api/admin/products/highest-rated', {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch('/api/admin/reviews', {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ])
        if (!pRes.ok) throw new Error('Failed to fetch top products')
        if (!rRes.ok) throw new Error('Failed to fetch reviews')
        const pJson = await pRes.json()
        const rJson = await rRes.json()
        setTopProducts(pJson.products || [])
        setReviews(rJson.reviews || [])
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [token])

  async function handleReply(id: number) {
    const reply = prompt('Admin reply:')
    if (reply == null) return
    await patchReview(id, { reply })
  }
  async function handleReaction(id: number, reaction: string) {
    await patchReview(id, { reaction })
  }
  async function patchReview(id: number, body: any) {
    const res = await fetch(`/api/admin/reviews/${id}/reply`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    })
    if (res.ok) {
      const { review } = await res.json()
      setReviews(prev => prev.map(r => (r.id === id ? review : r)))
    } else {
      alert('Failed')
    }
  }

  if (loading) return <p style={{ padding: '1rem' }}>Loading…</p>
  if (error) return <p style={{ padding: '1rem', color: 'red' }}>{error}</p>

  return (
    <main style={{ padding: '2rem' }}>
      <h1 style={{ marginBottom: '1rem' }}>Reviews & Ratings</h1>

      <h2 style={{ fontSize: '1.1rem', margin: '1rem 0 0.5rem' }}>Top Rated Products</h2>
      {topProducts.length === 0 ? (
        <p>No ratings yet.</p>
      ) : (
        <table style={{ minWidth: '400px', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left' }}>Product</th>
              <th>Avg ★</th>
              <th># Reviews</th>
            </tr>
          </thead>
          <tbody>
            {topProducts.map(p => (
              <tr key={p.id}>
                <td><Link href={`/products/${p.id}`}>{p.name}</Link></td>
                <td>{p.avgRating.toFixed(1)}</td>
                <td>{p.reviewCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h2 style={{ fontSize: '1.1rem', margin: '2rem 0 0.5rem' }}>Latest Reviews</h2>
      {reviews.length === 0 ? (
        <p>No reviews yet.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left' }}>Product</th>
              <th>User</th>
              <th>Rating</th>
              <th>Comment</th>
              <th>Admin</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {reviews.map(r => (
              <tr key={r.id} style={{ borderTop: '1px solid #eee' }}>
                <td>{r.product ? <Link href={`/products/${r.product.id}`}>{r.product.name}</Link> : 'N/A'}</td>
                <td>{r.user.fullName}</td>
                <td>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</td>
                <td>{r.comment || '-'}</td>
                <td>{r.adminReaction || ''} {r.adminReply || ''}</td>
                <td>
                  <button onClick={() => handleReaction(r.id, '👍')}>👍</button>{' '}
                  <button onClick={() => handleReaction(r.id, '😊')}>😊</button>{' '}
                  <button onClick={() => handleReply(r.id)}>Reply</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  )
} 