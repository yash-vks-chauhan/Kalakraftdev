const WORDS = ['Clocks', 'Trays', 'Wall Art', 'Rangoli', 'Coasters', 'Vases', 'Custom Pieces']

function Row() {
  return (
    <div className="flex shrink-0 items-center">
      {WORDS.map(word => (
        <span key={word} className="flex items-center">
          <span className="whitespace-nowrap px-8 font-serif text-[5.5rem] font-medium italic leading-none text-transparent [-webkit-text-stroke:1px_#d6d6d6] transition-all duration-300 hover:[-webkit-text-stroke:1px_#d4a373]">
            {word}
          </span>
          <span className="h-1.5 w-1.5 rounded-full bg-[#d4a373]/70" />
        </span>
      ))}
    </div>
  )
}

// Outlined serif marquee between sections — the Vue Bits ScrollVelocity idea
// reduced to a calm, constant drift. Decorative only.
export default function MarqueeDivider() {
  return (
    <section
      aria-hidden="true"
      className="select-none overflow-hidden border-y border-[#ececec] bg-white py-14"
    >
      <div className="flex w-max animate-[home-marquee_70s_linear_infinite] hover:[animation-play-state:paused] motion-reduce:animate-none">
        <Row />
        <Row />
      </div>
    </section>
  )
}
