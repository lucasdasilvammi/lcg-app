const cornerClasses = {
  target: [
    'absolute -top-0.5 -left-0.5 w-16 h-22 pointer-events-none text-bg',
    'absolute -top-0.5 -right-0.5 w-12 h-16 pointer-events-none text-bg',
    'absolute -bottom-0.5 -right-0.5 w-18 h-18 pointer-events-none text-bg',
    'absolute -bottom-0.5 -left-1.5 w-20 h-22 pointer-events-none text-bg'
  ],
  player: [
    'absolute -top-0.5 -left-0.5 w-10 h-13 pointer-events-none text-bg',
    'absolute -top-0.5 -right-0.5 w-7 h-10 pointer-events-none text-bg',
    'absolute -bottom-0.5 -right-0.5 w-11 h-11 pointer-events-none text-bg',
    'absolute -bottom-0.5 -left-0.5 w-12 h-14 pointer-events-none text-bg'
  ],
  preview: [
    'absolute -top-0.5 -left-0.5 w-11 h-15 pointer-events-none text-bg',
    'absolute -top-0.5 -right-0.5 w-12 h-16 pointer-events-none text-bg',
    'absolute -bottom-0.5 -right-0.5 w-10 h-10 pointer-events-none text-bg',
    'absolute -bottom-0.5 -left-0.5 w-13 h-16 pointer-events-none text-bg'
  ]
}

const corners = [
  {
    width: 111,
    height: 158,
    viewBox: '0 0 111 158',
    path: 'M21.899 24.2268L13.0242 65.0001L0 157.794V0H110.972L51.4437 14.7298L21.899 24.2268Z'
  },
  {
    width: 168,
    height: 224,
    viewBox: '0 0 168 224',
    path: 'M144.05 26.7421L85.492 17.1343L0 0H167.278V223.788L153.278 138.676L144.05 26.7421Z'
  },
  {
    width: 136,
    height: 137,
    viewBox: '0 0 136 137',
    path: 'M112.263 114.125L80.5867 122.974L0 136.974H135.075V0L121.075 88.6065L112.263 114.125Z'
  },
  {
    width: 170,
    height: 210,
    viewBox: '0 0 170 210',
    path: 'M23.2769 187.536L11.6245 124.918L0 0V209.339H169.849L107.077 200.319L23.2769 187.536Z'
  }
]

export default function PickColorSwatch({
  color,
  className,
  variant = 'preview',
  submitted
}) {
  return (
    <div className={className}>
      <div className="w-full h-full" style={{ backgroundColor: color }} />
      {corners.map((corner, index) => (
        <svg
          key={corner.viewBox}
          width={corner.width}
          height={corner.height}
          viewBox={corner.viewBox}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={cornerClasses[variant][index]}
        >
          <path d={corner.path} fill="currentColor" />
        </svg>
      ))}
      {typeof submitted === 'boolean' && (
        <img
          src={submitted ? '/game/questions/bonne-reponse.svg' : '/game/questions/inprogress-reponse.svg'}
          alt={submitted ? 'Validé' : 'En cours'}
          className="absolute -top-2 -right-3 h-7 w-7 rotate-10"
        />
      )}
    </div>
  )
}
