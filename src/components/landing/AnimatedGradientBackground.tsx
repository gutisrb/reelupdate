import { motion } from 'framer-motion';

export const AnimatedGradientBackground = () => {
  return (
    <div className="absolute inset-0 overflow-hidden -z-10">
      {/* Animated mesh gradient background */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(circle at 50% 50%, #0F172A 0%, #0F172A 100%)',
        }}
      >
        {/* Cyan blob */}
        <motion.div
          className="absolute w-[600px] h-[600px] rounded-full blur-[120px] opacity-30"
          style={{
            background: '#0EA5E9',
          }}
          animate={{
            x: ['-10%', '10%', '-10%'],
            y: ['-10%', '20%', '-10%'],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          initial={{ x: '20%', y: '10%' }}
        />

        {/* Orange blob */}
        <motion.div
          className="absolute w-[500px] h-[500px] rounded-full blur-[100px] opacity-25"
          style={{
            background: '#F97316',
          }}
          animate={{
            x: ['10%', '-10%', '10%'],
            y: ['20%', '-10%', '20%'],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          initial={{ x: '70%', y: '60%' }}
        />

        {/* Additional cyan accent */}
        <motion.div
          className="absolute w-[400px] h-[400px] rounded-full blur-[90px] opacity-20"
          style={{
            background: '#0EA5E9',
          }}
          animate={{
            x: ['5%', '-5%', '5%'],
            y: ['-5%', '10%', '-5%'],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          initial={{ x: '50%', y: '80%' }}
        />
      </motion.div>

      {/* Noise texture overlay */}
      <div
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
};
