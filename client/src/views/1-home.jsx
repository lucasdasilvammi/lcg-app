import React from 'react'
import logoUrl from '/room/logo.svg'
import ButtonWithIcon from '../components/ButtonWithIcon'

export default function Home({ onCreate, onJoin }) {
  return (
    <>
       {/* Content */}
        <div className="relative z-10 flex flex-col justify-between items-center h-screen p-20 w-110">
          <img src={logoUrl} alt="Le Cube Graphique" className="w-48"/>
          <div className='flex flex-col gap-4 items-center w-3/4 '>
            <ButtonWithIcon 
              onClick={onCreate}
              text="CRÉER"
              icon={
                <svg width="42" height="42" viewBox="0 0 42 42" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M31.6817 21.5393L16.526 36.2517L13.7569 6.62274L31.6817 21.5393Z" fill="currentColor"/>
                </svg>
              }
              className="font-funnel font-bold text-xl w-full"
            />
            <ButtonWithIcon 
              className="w-full"
              onClick={onJoin}
              text="REJOINDRE"
              icon={
                <svg width="42" height="42" viewBox="0 0 42 42" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" clipRule="evenodd" d="M18.146 8.53355L17.9108 13.0895V18.1964L13.1314 17.9468H8.96243L7.3946 18.2371L7.08719 18.814L7.3946 22.9066L7.91653 23.736L12.2584 24.0392L17.9108 23.7653L17.5731 30.6559L17.8197 34.018L18.5866 34.2837H21.3572L23.3757 33.7741L23.7828 32.1963V28.827L23.7183 23.7653L26.744 24.0392L32.614 23.7653L33.9304 23.5929L34.3434 22.9174L34.7724 19.4221L34.4545 18.3965L31.1828 18.0758L28.34 17.9732L23.9291 18.0758L24.2432 13.144V9.18159L24.0799 7.80484L22.8061 7.71661L18.467 7.98787L18.146 8.53355Z" fill="currentColor"/>
                </svg>
              }
            />
          </div>
          {/* Background SVG */}
          <div 
            className="absolute inset-0 -left-4 -top-11 w-115 h-[110vh] pointer-events-none z-0"
            style={{
              backgroundImage: 'url(/assets/home-border.svg)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat'
            }}
          />
        </div>
    </>
  )
}
