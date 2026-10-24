import React from "react";
import { motion } from "framer-motion";

import { BallCanvas } from "./canvas";
import { SectionWrapper } from "../hoc";
import { technologies } from "../constants";

const Tech = () => {
  return (
    <div>
      <h2 className='text-white text-2xl sm:text-3xl font-black'>Tools in orbit.</h2>
      <p className='mt-2 max-w-2xl text-secondary text-sm sm:text-base'>A working toolkit for building, shipping, observing, and evolving reliable systems.</p>
      <div className='mt-8 flex flex-row flex-wrap justify-center gap-6 sm:gap-10'>
      {technologies.map((technology, index) => (
        <motion.div
          initial={{ opacity: 0, scale: 0.78, y: 18 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          whileHover={{ y: -8, scale: 1.08 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ type: "spring", stiffness: 180, damping: 15, delay: index * 0.045 }}
          className='relative w-28 h-28 rounded-full border border-gold/15 bg-gold/[0.03] shadow-[0_0_30px_rgba(214,168,75,0.05)] hover:border-gold/55 hover:shadow-[0_0_32px_rgba(214,168,75,0.2)]'
          key={technology.name}
        >
          <BallCanvas icon={technology.icon} />
        </motion.div>
      ))}
      </div>
    </div>
  );
};

export default SectionWrapper(Tech, "stack");
