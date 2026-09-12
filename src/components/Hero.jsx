import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

import { styles } from "../styles";
import { ComputersCanvas } from "./canvas";

const headlines = [
  {
    lead: "Because if you have an AI idea, I turn it into a",
    prefix: "Reliable & Scalable",
    highlight: "Production-Ready System.",
  },
  {
    lead: "Because you need real results and ask yourself,",
    prefix: "How do I get AI That Actually Works in",
    highlight: "Production?",
  },
  {
    lead: "Because you know that,",
    prefix: "Your AI Idea Deserves More Than a",
    highlight: "Prototype.",
  },
  {
    lead: "Because you're exploring the question,",
    prefix: "What If Your Software Could",
    highlight: "Think, Search & Act?",
  },
  {
    lead: "Because you need a specialist where,",
    prefix: "Robust Backend Engineering Meets",
    highlight: "Agentic AI.",
  },
];

const Hero = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prevIndex) => (prevIndex + 1) % headlines.length);
    }, 3600);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className={`relative w-full h-screen mx-auto`}>
      <div
        className={`absolute inset-0 top-[120px] max-w-7xl mx-auto ${styles.paddingX} flex flex-row items-start gap-5`}
      >
        <div className='flex flex-col justify-center items-center mt-5'>
          <div className='w-5 h-5 rounded-full bg-[#915EFF]' />
          <div className='w-1 sm:h-80 h-40 violet-gradient' />
        </div>

        <div>
          <h1 className={`${styles.heroHeadText} text-white`}>
            Hi, I'm <span className='text-[#915EFF]'>Yash</span>
          </h1>

          <p className='text-secondary font-medium lg:text-[22px] sm:text-[18px] text-[15px] mt-1'>
            And you are here for a Reason
          </p>

          <div className='min-h-[110px] sm:min-h-[100px] mt-2 flex items-start'>
            <AnimatePresence mode='wait'>
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -14 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
              >
                <p className='text-secondary font-medium lg:text-[20px] sm:text-[17px] text-[14px] mb-1'>
                  {headlines[index].lead}
                </p>
                <p className={`${styles.heroSubText} text-white-100 leading-normal`}>
                  <span>{headlines[index].prefix} </span>
                  <span className='text-[#915EFF] font-bold'>
                    {headlines[index].highlight}
                  </span>
                </p>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
      <ComputersCanvas />

      <div className='absolute xs:bottom-10 bottom-32 w-full flex justify-center items-center'>
        <a href='#about'>
          <div className='w-[35px] h-[64px] rounded-3xl border-4 border-secondary flex justify-center items-start p-2'>
            <motion.div
              animate={{
                y: [0, 24, 0],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                repeatType: "loop",
              }}
              className='w-3 h-3 rounded-full bg-secondary mb-1'
            />
          </div>
        </a>
      </div>
    </section>
  );
};

export default Hero;