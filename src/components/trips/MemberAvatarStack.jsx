/** Overlapping avatar stack for trip members. */
export default function MemberAvatarStack({ members = [], max = 4, size = 32 }) {
  const shown    = members.slice(0, max)
  const overflow = members.length - max

  return (
    <div className="flex items-center" style={{ marginLeft: size * 0.25 }}>
      {shown.map((m, i) => {
        const initials = (m.display_name ?? 'T').slice(0, 2).toUpperCase()
        return (
          <div
            key={m.id}
            title={m.display_name ?? 'Member'}
            className="rounded-full border-2 border-white flex items-center justify-center text-white font-bold select-none"
            style={{
              width: size,
              height: size,
              fontSize: size * 0.35,
              backgroundColor: m.avatar_color ?? '#3B82F6',
              marginLeft: i === 0 ? 0 : -(size * 0.25),
              zIndex: shown.length - i,
              position: 'relative',
            }}
          >
            {initials}
          </div>
        )
      })}
      {overflow > 0 && (
        <div
          className="rounded-full border-2 border-white bg-gray-300 flex items-center justify-center text-gray-600 font-bold select-none"
          style={{ width: size, height: size, fontSize: size * 0.3, marginLeft: -(size * 0.25), zIndex: 0 }}
        >
          +{overflow}
        </div>
      )}
    </div>
  )
}
