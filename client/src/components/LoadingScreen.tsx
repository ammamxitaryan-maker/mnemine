import { motion } from 'framer-motion'
import React, { useEffect } from 'react'

interface LoadingScreenProps {
  onFinish?: () => void
  duration?: number
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  onFinish,
  duration = 5000
}) => {

  useEffect(() => {
    const timer = setTimeout(() => {
      onFinish?.()
    }, duration)

    return () => clearTimeout(timer)
  }, [onFinish, duration])

  // Add click to skip functionality
  const handleClick = () => {
    onFinish?.()
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 1.0,
        staggerChildren: 0.3
      }
    }
  }


  const textVariants = {
    hidden: {
      opacity: 0,
      y: 50,
      scale: 0.8
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: 'spring' as const,
        stiffness: 80,
        damping: 20,
        duration: 0.8
      }
    }
  }

  const letterVariants = {
    hidden: {
      opacity: 0,
      y: 20,
      rotateX: -90
    },
    visible: {
      opacity: 1,
      y: 0,
      rotateX: 0,
      transition: {
        type: 'spring' as const,
        stiffness: 150,
        damping: 25,
        duration: 0.6
      }
    }
  }

  const _pulseVariants = {
    pulse: {
      scale: [1, 1.05, 1],
      opacity: [0.8, 1, 0.8],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut' as const
      }
    }
  }

  return (
    <motion.div
      className="fixed inset-0 bg-gradient-to-b from-black via-[#030617] to-[#001] flex items-center justify-center z-50 cursor-pointer touch-manipulation"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      onClick={handleClick}
      transition={{ type: "spring" as const, stiffness: 300, damping: 30 }}
    >
      <div className="text-center">
        {/* NON Text */}
        <motion.div
          className="mb-1 xs:mb-1.5 sm:mb-2 md:mb-3 lg:mb-4"
          variants={textVariants}
        >
          <div className="flex justify-center items-center">
            {/* Letter N - First */}
            <motion.span
              className="letter-n-first font-black text-white tracking-wider flex items-center justify-center"
              variants={letterVariants}
              style={{
                textShadow: '0 0 20px rgba(255, 255, 255, 0.5)',
                fontFamily: 'Inter, system-ui, sans-serif',
                fontSize: 'var(--size)',
                lineHeight: 'var(--size)',
                width: 'var(--size)',
                height: 'var(--size)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              N
            </motion.span>

            {/* Mickey Mouse Head instead of O */}
            <motion.div
              className="mickey-container flex items-center justify-center"
              variants={letterVariants}
              style={{
                width: 'var(--size)',
                height: 'var(--size)',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transformOrigin: 'center center'
              }}
            >
              <div className="mickey">
                <div className="ear ear-left" style={{ '--r': '-12deg' } as React.CSSProperties}></div>
                <div className="ear ear-right" style={{ '--r': '12deg' } as React.CSSProperties}></div>
                <div className="head">
                  <div className="eye eye-left"></div>
                  <div className="eye eye-right"></div>
                  <div className="nose"></div>
                </div>
              </div>
            </motion.div>

            {/* Letter N - Second */}
            <motion.span
              className="letter-n-second font-black text-white tracking-wider flex items-center justify-center"
              variants={letterVariants}
              style={{
                textShadow: '0 0 20px rgba(255, 255, 255, 0.5)',
                fontFamily: 'Inter, system-ui, sans-serif',
                fontSize: 'var(--size)',
                lineHeight: 'var(--size)',
                width: 'var(--size)',
                height: 'var(--size)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              N
            </motion.span>
          </div>
        </motion.div>

        {/* MINE Text */}
        <motion.div
          variants={textVariants}
          animate="pulse"
        >
          <div className="flex justify-center items-center gap-0.5 xs:gap-0.5 sm:gap-1 md:gap-1.5 lg:gap-2">
            {['M', 'I', 'N', 'E'].map((letter, index) => (
              <motion.span
                key={`mine-letter-${letter}-${index}`}
                className="text-lg xs:text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-cyan-400 tracking-wider"
                variants={letterVariants}
                style={{
                  textShadow: '0 0 15px rgba(6,182,212,0.8), 0 0 40px rgba(34,211,238,0.4)',
                  fontFamily: 'Inter, system-ui, sans-serif',
                  filter: 'drop-shadow(0 0 8px rgba(6,182,212,0.3))'
                }}
              >
                {letter}
              </motion.span>
            ))}
          </div>
        </motion.div>

        {/* Loading Indicator */}
        <motion.div
          className="mt-1 xs:mt-2 sm:mt-3 md:mt-4 lg:mt-6 xl:mt-8 flex justify-center"
          variants={textVariants}
        >
          <div className="loading-dots flex space-x-0.5 xs:space-x-0.5 sm:space-x-1 md:space-x-1.5 lg:space-x-2">
            {[0, 1, 2].map((index) => (
              <motion.div
                key={`loading-dot-${index}`}
                className="dot w-1 h-1 xs:w-1 xs:h-1 sm:w-1.5 sm:h-1.5 md:w-2 md:h-2 lg:w-2.5 lg:h-2.5 bg-cyan-400 rounded-full"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: index * 0.2,
                  ease: 'easeInOut' as const
                }}
              />
            ))}
          </div>
        </motion.div>

      </div>

      {/* Background Glow Effect */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-purple-500/5 rounded-full blur-2xl animate-ping" />
      </motion.div>

      {/* Floating Particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={`floating-particle-${i}`}
            className="absolute w-1 h-1 bg-white/20 rounded-full"
            initial={{
              x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1920),
              y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1080),
              opacity: 0
            }}
            animate={{
              y: [null, -100],
              opacity: [0, 1, 0]
            }}
            transition={{
              duration: Math.random() * 3 + 2,
              repeat: Infinity,
              delay: Math.random() * 2,
              ease: "easeOut" as const
            }}
          />
        ))}
      </div>

      {/* Animated Grid Background */}
      <motion.div
        className="absolute inset-0 pointer-events-none opacity-5"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.05 }}
        transition={{ duration: 2 }}
      >
        <div className="grid-background"></div>
      </motion.div>

      {/* Mickey Mouse CSS Styles */}
      <style>{`
         :root {
           --size: 40px;
           --color: #ffffff;
         }

         @media (min-width: 320px) {
           :root {
             --size: 45px;
           }
         }

         @media (min-width: 360px) {
           :root {
             --size: 50px;
           }
         }

         @media (min-width: 375px) {
           :root {
             --size: 55px;
           }
         }

         @media (min-width: 414px) {
           :root {
             --size: 60px;
           }
         }

         @media (min-width: 480px) {
           :root {
             --size: 70px;
           }
         }

         @media (min-width: 640px) {
           :root {
             --size: 85px;
           }
         }

         @media (min-width: 768px) {
           :root {
             --size: 100px;
           }
         }

         @media (min-width: 1024px) {
           :root {
             --size: 120px;
           }
         }

         @media (min-width: 1280px) {
           :root {
             --size: 140px;
           }
         }

         @media (min-width: 1536px) {
           :root {
             --size: 160px;
           }
         }

         @media (min-width: 1920px) {
           :root {
             --size: 180px;
           }
         }

         .letter-n-first {
           font-size: 40px !important;
           line-height: 40px !important;
           width: 40px !important;
           height: 40px !important;
           display: flex !important;
           align-items: center !important;
           justify-content: center !important;
           margin-right: calc(var(--size) * 0.05) !important;
         }

         .letter-n-second {
           font-size: 40px !important;
           line-height: 40px !important;
           width: 40px !important;
           height: 40px !important;
           display: flex !important;
           align-items: center !important;
           justify-content: center !important;
           margin-left: calc(var(--size) * 0.05) !important;
         }

         @media (min-width: 320px) {
           .letter-n-first, .letter-n-second {
             font-size: 45px !important;
             line-height: 45px !important;
             width: 45px !important;
             height: 45px !important;
             display: flex !important;
             align-items: center !important;
             justify-content: center !important;
           }
         }

         @media (min-width: 360px) {
           .letter-n-first, .letter-n-second {
             font-size: 50px !important;
             line-height: 50px !important;
             width: 50px !important;
             height: 50px !important;
           }
         }

         @media (min-width: 375px) {
           .letter-n-first, .letter-n-second {
             font-size: 55px !important;
             line-height: 55px !important;
             width: 55px !important;
             height: 55px !important;
           }
         }

         @media (min-width: 414px) {
           .letter-n-first, .letter-n-second {
             font-size: 60px !important;
             line-height: 60px !important;
             width: 60px !important;
             height: 60px !important;
           }
         }

         @media (min-width: 480px) {
           .letter-n-first, .letter-n-second {
             font-size: 70px !important;
             line-height: 70px !important;
             width: 70px !important;
             height: 70px !important;
           }
         }

         @media (min-width: 640px) {
           .letter-n-first, .letter-n-second {
             font-size: 85px !important;
             line-height: 85px !important;
             width: 85px !important;
             height: 85px !important;
           }
         }

         @media (min-width: 768px) {
           .letter-n-first, .letter-n-second {
             font-size: 100px !important;
             line-height: 100px !important;
             width: 100px !important;
             height: 100px !important;
           }
         }

         @media (min-width: 1024px) {
           .letter-n-first, .letter-n-second {
             font-size: 120px !important;
             line-height: 120px !important;
             width: 120px !important;
             height: 120px !important;
           }
         }

         @media (min-width: 1280px) {
           .letter-n-first, .letter-n-second {
             font-size: 140px !important;
             line-height: 140px !important;
             width: 140px !important;
             height: 140px !important;
           }
         }

         @media (min-width: 1536px) {
           .letter-n-first, .letter-n-second {
             font-size: 160px !important;
             line-height: 160px !important;
             width: 160px !important;
             height: 160px !important;
           }
         }

         @media (min-width: 1920px) {
           .letter-n-first, .letter-n-second {
             font-size: 180px !important;
             line-height: 180px !important;
             width: 180px !important;
             height: 180px !important;
           }
         }

         .mickey-container {
           display: flex !important;
           align-items: center !important;
           justify-content: center !important;
           margin: 0 calc(var(--size) * 0.05) !important;
         }

         .mickey {
           width: var(--size);
           height: calc(var(--size) * 0.95);
           position: relative;
           display: block;
           transform-origin: center center;
           animation: appear 1200ms cubic-bezier(.2,.9,.3,1) both;
           will-change: transform;
           margin: 0 auto;
         }

         .mickey .head {
           width: var(--size);
           height: var(--size);
           background: var(--color);
           border-radius: 50%;
           position: absolute;
           left: 0;
           top: calc(var(--size) * 0.1);
           box-shadow: 0 12px 30px rgba(0,0,0,0.6), inset 0 -8px 20px rgba(255,255,255,0.03);
           z-index: 2;
         }

         .mickey .eye {
           width: calc(var(--size) * 0.16);
           height: calc(var(--size) * 0.16);
           background: #000;
           border-radius: 50%;
           position: absolute;
           top: calc(var(--size) * 0.32);
           animation: blink 3s ease-in-out infinite;
         }

         .mickey .eye-left {
           left: calc(var(--size) * 0.28);
         }

         .mickey .eye-right {
           right: calc(var(--size) * 0.28);
         }

         .mickey .nose {
           width: calc(var(--size) * 0.08);
           height: calc(var(--size) * 0.08);
           background: #000;
           border-radius: 50%;
           position: absolute;
           top: calc(var(--size) * 0.5);
           left: 50%;
           transform: translateX(-50%);
         }


         @keyframes blink {
           0%, 90%, 100% { transform: scaleY(1); }
           95% { transform: scaleY(0.1); }
         }


         .mickey .ear {
           width: calc(var(--size) * 0.56);
           height: calc(var(--size) * 0.56);
           background: var(--color);
           border-radius: 50%;
           position: absolute;
           top: 0;
           z-index: 1;
           box-shadow: 0 8px 24px rgba(0,0,0,0.55), inset 0 -6px 12px rgba(255,255,255,0.02);
           transform-origin: center center;
         }

         .mickey .ear-left {
           left: -12%;
           transform: rotate(-12deg);
           animation: earPop 1.2s cubic-bezier(.2,.9,.3,1) both;
           animation-delay: 0.2s;
         }

         .mickey .ear-right {
           right: -12%;
           transform: rotate(12deg);
           animation: earPop 1.2s cubic-bezier(.2,.9,.3,1) both;
           animation-delay: 0.3s;
         }

         @keyframes appear {
           0% {
             opacity: 0;
             transform: scale(0.6) translateY(12px);
           }
           60% {
             opacity: 1;
             transform: scale(1.06) translateY(0);
           }
           100% {
             opacity: 1;
             transform: scale(1) translateY(0);
           }
         }

         @keyframes earPop {
           0% {
             transform: scale(0.6) rotate(var(--r,0deg));
             opacity: 0;
           }
           60% {
             transform: scale(1.08) rotate(var(--r,0deg));
             opacity: 1;
           }
           100% {
             transform: scale(1) rotate(var(--r,0deg));
             opacity: 1;
           }
         }

         .mickey:hover {
           animation: breathe 1400ms ease-in-out infinite;
         }

         @keyframes breathe {
           0% {
             transform: translateY(0) scale(1);
           }
           50% {
             transform: translateY(-6px) scale(1.01);
           }
           100% {
             transform: translateY(0) scale(1);
           }
         }

         .grid-background {
           position: absolute;
           top: 0;
           left: 0;
           width: 100%;
           height: 100%;
           background-image: 
             linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
             linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px);
           background-size: 50px 50px;
           animation: grid-move 20s linear infinite;
         }

         @keyframes grid-move {
           0% { transform: translate(0, 0); }
           100% { transform: translate(50px, 50px); }
         }

         /* Enhanced Mickey Mouse Effects */
         .mickey .head::before {
           content: '';
           position: absolute;
           top: 20%;
           left: 20%;
           width: 60%;
           height: 60%;
           background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
           border-radius: 50%;
           animation: head-shine 3s ease-in-out infinite;
         }

         @keyframes head-shine {
           0%, 100% { opacity: 0.3; transform: scale(1); }
           50% { opacity: 0.6; transform: scale(1.1); }
         }

         /* Improved Loading Dots */
         .loading-dots .dot {
           position: relative;
         }

         .loading-dots .dot::before {
           content: '';
           position: absolute;
           top: 50%;
           left: 50%;
           width: 100%;
           height: 100%;
           background: inherit;
           border-radius: inherit;
           transform: translate(-50%, -50%);
           animation: dot-glow 1.5s ease-in-out infinite;
         }

         @keyframes dot-glow {
           0%, 100% { 
             transform: translate(-50%, -50%) scale(1);
             opacity: 0.5;
           }
           50% { 
             transform: translate(-50%, -50%) scale(2);
             opacity: 0;
           }
         }

         @media (max-width: 420px) {
           :root {
             --size: 80px;
           }
         }
       `}</style>
    </motion.div>
  )
}

export default LoadingScreen
