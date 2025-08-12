export default function MobileCartPage() {
  // Render a minimal client component to avoid early crashes during hydration
  const Safe = React.useMemo(() => require('./MobileCartClient').default, [])
  return <Safe />
}
