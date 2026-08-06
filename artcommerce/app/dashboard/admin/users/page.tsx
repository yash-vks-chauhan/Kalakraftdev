'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Users,
  ShieldCheck,
  UserRound,
  Search,
  Mail,
  Trash2,
  ShoppingBag,
  Send,
  ArrowUpCircle,
  ArrowDownCircle,
} from 'lucide-react'

import { useAuth } from '../../../contexts/AuthContext'
import ConfirmDialog from '../../../components/ConfirmDialog'
import { SegmentedControl, SegmentedControlItem } from '../../_components/SegmentedControl'
import { ActionSheet } from '../../_components/ActionSheet'
import {
  DataCard,
  DataCardEmpty,
  DataCardList,
  DataCardSkeleton,
  DesktopTableFrame,
} from '../../_components/DataCardList'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface UserRow {
  id: number
  fullName: string
  email: string
  role: string
  createdAt: string
  abandonedCartCount: number
}

type TabKey = 'all' | 'admin' | 'user'

const tabs: { key: TabKey; label: string; icon: typeof Users; filter: string | null }[] = [
  { key: 'all', label: 'All users', icon: Users, filter: null },
  { key: 'admin', label: 'Admins', icon: ShieldCheck, filter: 'admin' },
  { key: 'user', label: 'Customers', icon: UserRound, filter: 'user' },
]

function initialsOf(name?: string) {
  if (!name) return '?'
  return name
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export default function AdminUsersPage() {
  const { token, user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const filterParam = searchParams.get('filter')

  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<UserRow | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [remindingId, setRemindingId] = useState<number | null>(null)
  const [roleTarget, setRoleTarget] = useState<UserRow | null>(null)
  const [isUpdatingRole, setIsUpdatingRole] = useState(false)

  const activeTab: TabKey =
    filterParam === 'admin' ? 'admin' : filterParam === 'user' ? 'user' : 'all'

  useEffect(() => {
    if (user?.role !== 'admin') return
    fetch('/api/admin/users', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((json) => setUsers(json.users ?? []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [token, user])

  const counts = useMemo(() => {
    const admins = users.filter((u) => u.role === 'admin').length
    const customers = users.filter((u) => u.role === 'user').length
    return { total: users.length, admins, customers }
  }, [users])

  const displayUsers = useMemo(() => {
    let list = users
    if (activeTab !== 'all') list = list.filter((u) => u.role === activeTab)
    const q = query.trim().toLowerCase()
    if (q) {
      list = list.filter(
        (u) =>
          u.fullName.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q)
      )
    }
    return list
  }, [users, activeTab, query])

  function setTab(tab: TabKey) {
    const params = new URLSearchParams(searchParams.toString())
    if (tab === 'all') params.delete('filter')
    else params.set('filter', tab)
    const qs = params.toString()
    router.push(qs ? `/dashboard/admin/users?${qs}` : '/dashboard/admin/users')
  }

  async function handleConfirmRoleChange() {
    if (!roleTarget) return
    const newRole = roleTarget.role === 'admin' ? 'user' : 'admin'
    setIsUpdatingRole(true)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId: roleTarget.id, role: newRole }),
      })
      if (!res.ok) throw new Error('Failed to update role')
      const { user: updated } = await res.json()
      setUsers((prev) => prev.map((u) => (u.id === roleTarget.id ? updated : u)))
      setRoleTarget(null)
    } catch (error: any) {
      alert(error.message || 'Failed to update role')
    } finally {
      setIsUpdatingRole(false)
    }
  }

  async function handleDeleteUser() {
    if (!deleteTarget) return
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/admin/users/${deleteTarget.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to delete user')
      setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id))
      setDeleteTarget(null)
    } catch (error: any) {
      alert(error.message || 'Failed to delete user')
    } finally {
      setIsDeleting(false)
    }
  }

  async function handleRemind(id: number) {
    setRemindingId(id)
    try {
      await fetch(`/api/admin/users/${id}/remind-cart`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      alert('Reminder sent!')
    } finally {
      setRemindingId(null)
    }
  }

  if (user?.role !== 'admin') {
    return (
      <main>
        <p className="text-sm text-muted-foreground">Unauthorized</p>
      </main>
    )
  }

  return (
    <main className="flex flex-col gap-6">
      {/* Page header */}
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">User management</h1>
        <p className="text-sm text-muted-foreground">
          View, search, and manage every account on Artcommerce.
        </p>
      </header>

      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-3">
        {loading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard icon={Users} label="Total users" value={counts.total} loading={false} />
            <StatCard icon={ShieldCheck} label="Admins" value={counts.admins} loading={false} />
            <StatCard icon={UserRound} label="Customers" value={counts.customers} loading={false} />
          </>
        )}
      </div>

      <Card className="shadow-sm">
        <CardHeader className="gap-4 p-4 sm:p-6">
          <div className="flex flex-col gap-1">
            <CardTitle>Accounts</CardTitle>
            <CardDescription>
              Switch tabs to filter by role or use search to find someone fast.
            </CardDescription>
          </div>

          {/* Top tabs + search */}
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <SegmentedControl<TabKey>
              ariaLabel="Filter users by role"
              value={activeTab}
              onChange={setTab}
              items={tabs.map<SegmentedControlItem<TabKey>>((t) => ({
                key: t.key,
                label: t.label,
                icon: t.icon,
                count:
                  t.key === 'all'
                    ? counts.total
                    : t.key === 'admin'
                    ? counts.admins
                    : counts.customers,
              }))}
            />

            <div className="relative w-full lg:w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name or email"
                className="pl-9"
                aria-label="Search users"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {/* Desktop: full table. Mobile: stacked cards below. */}
          <DesktopTableFrame>
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className="px-4">User</TableHead>
                  <TableHead className="px-4">Role</TableHead>
                  <TableHead className="px-4">Joined</TableHead>
                  <TableHead className="px-4">Abandoned cart</TableHead>
                  <TableHead className="px-4 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <UserRowSkeleton key={i} />
                  ))
                ) : displayUsers.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="px-4 py-10 text-center text-sm text-muted-foreground"
                    >
                      No users match this view.
                    </TableCell>
                  </TableRow>
                ) : (
                  displayUsers.map((u) => (
                    <TableRow key={u.id} className="align-middle">
                      <TableCell className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9 border">
                            <AvatarFallback className="bg-secondary text-xs font-medium text-foreground">
                              {initialsOf(u.fullName)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex min-w-0 flex-col">
                            <span className="truncate text-sm font-medium text-foreground">
                              {u.fullName}
                            </span>
                            <span className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                              <Mail className="h-3 w-3" />
                              {u.email}
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="px-4 py-3">
                        {u.role === 'admin' ? (
                          <Badge className="gap-1 bg-foreground text-background hover:bg-foreground/90">
                            <ShieldCheck className="h-3 w-3" />
                            Admin
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="gap-1">
                            <UserRound className="h-3 w-3" />
                            Customer
                          </Badge>
                        )}
                      </TableCell>

                      <TableCell className="px-4 py-3 text-sm text-muted-foreground">
                        {formatDate(u.createdAt)}
                      </TableCell>

                      <TableCell className="px-4 py-3">
                        {u.abandonedCartCount > 0 ? (
                          <span className="inline-flex items-center gap-2 text-sm">
                            <span className="inline-flex h-2 w-2 rounded-full bg-amber-500" />
                            {u.abandonedCartCount} item
                            {u.abandonedCartCount === 1 ? '' : 's'}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </TableCell>

                      <TableCell className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setRoleTarget(u)}
                            className="gap-1.5"
                          >
                            {u.role === 'admin' ? (
                              <>
                                <ArrowDownCircle className="h-3.5 w-3.5" />
                                Demote
                              </>
                            ) : (
                              <>
                                <ArrowUpCircle className="h-3.5 w-3.5" />
                                Promote
                              </>
                            )}
                          </Button>

                          <Button
                            asChild
                            variant="outline"
                            size="sm"
                            className="gap-1.5"
                          >
                            <Link
                              href={`/dashboard/admin/orders?userId=${u.id}`}
                              aria-label={`View ${u.fullName}'s orders`}
                            >
                              <ShoppingBag className="h-3.5 w-3.5" />
                              Orders
                            </Link>
                          </Button>

                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={
                              u.abandonedCartCount === 0 || remindingId === u.id
                            }
                            onClick={() => handleRemind(u.id)}
                            className="gap-1.5"
                          >
                            <Send className="h-3.5 w-3.5" />
                            Remind
                          </Button>

                          <Separator
                            orientation="vertical"
                            className="mx-1 h-6"
                          />

                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => setDeleteTarget(u)}
                            aria-label={`Delete ${u.fullName}`}
                            className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </DesktopTableFrame>

          <DataCardList>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <DataCardSkeleton key={i} />
              ))
            ) : displayUsers.length === 0 ? (
              <DataCardEmpty
                icon={<Users className="h-5 w-5" />}
                title="No users match this view"
                description="Try another tab, or clear the search."
              />
            ) : (
              displayUsers.map((u) => (
                <AdminUserCard
                  key={u.id}
                  account={u}
                  reminding={remindingId === u.id}
                  onChangeRole={() => setRoleTarget(u)}
                  onRemind={() => handleRemind(u.id)}
                  onDelete={() => setDeleteTarget(u)}
                />
              ))
            )}
          </DataCardList>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete user"
        description={
          deleteTarget
            ? `Delete ${deleteTarget.fullName}? This action cannot be undone.`
            : ''
        }
        confirmLabel="Delete user"
        isProcessing={isDeleting}
        onConfirm={handleDeleteUser}
        onClose={() => {
          if (!isDeleting) setDeleteTarget(null)
        }}
      />

      <ConfirmDialog
        open={Boolean(roleTarget)}
        title={
          roleTarget?.role === 'admin'
            ? 'Demote to customer'
            : 'Promote to admin'
        }
        description={
          roleTarget
            ? roleTarget.role === 'admin'
              ? `Remove admin privileges from ${roleTarget.fullName}? They will lose access to the dashboard.`
              : `Grant admin privileges to ${roleTarget.fullName}? They will gain full dashboard access.`
            : ''
        }
        confirmLabel={
          roleTarget?.role === 'admin' ? 'Demote' : 'Promote'
        }
        isProcessing={isUpdatingRole}
        onConfirm={handleConfirmRoleChange}
        onClose={() => {
          if (!isUpdatingRole) setRoleTarget(null)
        }}
      />
    </main>
  )
}

/* -------------------------------------------------------------- */
/* MOBILE CARD                                                     */
/* -------------------------------------------------------------- */

function AdminUserCard({
  account,
  reminding,
  onChangeRole,
  onRemind,
  onDelete,
}: {
  account: UserRow
  reminding: boolean
  onChangeRole: () => void
  onRemind: () => void
  onDelete: () => void
}) {
  const [sheetOpen, setSheetOpen] = useState(false)
  const isAdmin = account.role === 'admin'
  const hasAbandoned = account.abandonedCartCount > 0

  return (
    <>
      <DataCard
        media={
          <Avatar className="h-12 w-12 border">
            <AvatarFallback className="bg-secondary text-sm font-medium text-foreground">
              {initialsOf(account.fullName)}
            </AvatarFallback>
          </Avatar>
        }
        title={account.fullName}
        badge={
          isAdmin ? (
            <Badge className="gap-1 bg-foreground text-background hover:bg-foreground/90">
              <ShieldCheck className="h-3 w-3" />
              Admin
            </Badge>
          ) : undefined
        }
        meta={account.email}
        submeta={
          <span className="inline-flex items-center gap-1.5">
            Joined {formatDate(account.createdAt)}
            {hasAbandoned && (
              <>
                <span aria-hidden>·</span>
                <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-500">
                  <span className="inline-flex h-1.5 w-1.5 rounded-full bg-amber-500" />
                  {account.abandonedCartCount} abandoned
                </span>
              </>
            )}
          </span>
        }
        onOpenActions={() => setSheetOpen(true)}
        actionsLabel={`Actions for ${account.fullName}`}
      />

      <ActionSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        title={account.fullName}
        description={account.email}
        groups={[
          {
            actions: [
              {
                id: 'role',
                label: isAdmin ? 'Demote to customer' : 'Promote to admin',
                icon: isAdmin ? ArrowDownCircle : ArrowUpCircle,
                description: isAdmin
                  ? 'Removes dashboard access'
                  : 'Grants full dashboard access',
                onSelect: onChangeRole,
              },
              {
                id: 'orders',
                label: 'View their orders',
                icon: ShoppingBag,
                href: `/dashboard/admin/orders?userId=${account.id}`,
              },
              {
                id: 'remind',
                label: 'Send cart reminder',
                icon: Send,
                description: hasAbandoned
                  ? `${account.abandonedCartCount} item${
                      account.abandonedCartCount === 1 ? '' : 's'
                    } left behind`
                  : 'Nothing abandoned in their cart',
                disabled: !hasAbandoned,
                pending: reminding,
                onSelect: onRemind,
              },
              {
                id: 'email',
                label: 'Email customer',
                icon: Mail,
                href: `mailto:${account.email}`,
              },
            ],
          },
          {
            actions: [
              {
                id: 'delete',
                label: 'Delete user',
                icon: Trash2,
                destructive: true,
                onSelect: onDelete,
              },
            ],
          },
        ]}
      />
    </>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  loading,
}: {
  icon: typeof Users
  label: string
  value: number
  loading: boolean
}) {
  return (
    <Card className="shadow-sm">
      <CardContent className="flex items-center gap-4 p-4">
        <span className="flex h-10 w-10 items-center justify-center rounded-md border bg-muted/50 text-foreground">
          <Icon className="h-5 w-5" />
        </span>
        <div className="flex flex-col">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </span>
          <span className="text-xl font-semibold tracking-tight text-foreground">
            {loading ? '—' : value.toLocaleString()}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

function StatCardSkeleton() {
  return (
    <Card className="shadow-sm">
      <CardContent className="flex items-center gap-4 p-4">
        <Skeleton className="h-10 w-10 rounded-md" />
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-6 w-14" />
        </div>
      </CardContent>
    </Card>
  )
}

function UserRowSkeleton() {
  return (
    <TableRow className="align-middle">
      <TableCell className="px-4 py-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <Skeleton className="h-3.5 w-32 max-w-full" />
            <Skeleton className="h-2.5 w-44 max-w-full" />
          </div>
        </div>
      </TableCell>
      <TableCell className="px-4 py-3">
        <Skeleton className="h-5 w-20 rounded-md" />
      </TableCell>
      <TableCell className="px-4 py-3">
        <Skeleton className="h-3.5 w-20" />
      </TableCell>
      <TableCell className="px-4 py-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-2 w-2 rounded-full" />
          <Skeleton className="h-3.5 w-16" />
        </div>
      </TableCell>
      <TableCell className="px-4 py-3">
        <div className="flex items-center justify-end gap-1.5">
          <Skeleton className="h-8 w-20 rounded-md" />
          <Skeleton className="h-8 w-20 rounded-md" />
          <Skeleton className="h-8 w-20 rounded-md" />
          <Skeleton className="h-6 w-px" />
          <Skeleton className="h-8 w-8 rounded-md" />
        </div>
      </TableCell>
    </TableRow>
  )
}
