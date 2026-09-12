import React from "react";
import { motion } from "framer-motion";

import { styles } from "../styles";
import { SectionWrapper } from "../hoc";
import { fadeIn, textVariant } from "../utils/motion";

const CallToAction = () => {
  return (
    <div className='w-full'>
      <motion.div variants={textVariant()}>
        <p className={styles.sectionSubText}>Think I could be a good fit?</p>
        <h2 className={styles.sectionHeadText}>
          If the work looks interesting,{" "}
          <span className='text-[#915EFF]'>let's talk.</span>
        </h2>
      </motion.div>

      <motion.div
        variants={fadeIn("up", "spring", 0.2, 0.75)}
        className='mt-8 rounded-3xl bg-gradient-to-r from-[#915EFF]/25 via-tertiary/70 to-black-100 p-[1px] shadow-card'
      >
        <div className='bg-tertiary/95 backdrop-blur-lg p-7 sm:p-10 rounded-3xl space-y-6'>
          <div className='inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-black-100/80 border border-[#915EFF]/30 text-xs font-mono font-semibold text-[#dfd9ff] w-fit'>
            <span className='w-2 h-2 rounded-full bg-emerald-400 animate-pulse' />
            AVAILABLE FOR ENGINEERING ROLES & HIGH-IMPACT SYSTEMS
          </div>

          <div className='space-y-4 text-secondary text-[16px] sm:text-[17px] leading-[30px]'>
            <p>
              You've seen the skills, the systems, and the problems I've solved.{" "}
              <strong className='text-white font-semibold'>
                What you haven't seen yet is what I can build when those skills are applied to your team's problems.
              </strong>
            </p>
            <p>
              I'm always interested in opportunities where I can engineer meaningful products, solve difficult technical problems, and grow with the systems I build.
            </p>
          </div>

          <div className='pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
            <p className='text-[#dfd9ff] font-medium text-[15px] sm:text-[16px]'>
              Have a role, problem, or idea in mind?{" "}
              <span className='text-white font-bold'>Start a conversation.</span>
            </p>

            <div className='flex items-center gap-3'>
              <a
                href='#contact'
                className='bg-gradient-to-r from-[#915EFF] to-[#7945eb] hover:from-[#7e47ec] hover:to-[#915EFF] py-3 px-6 rounded-xl text-white font-bold text-sm shadow-md shadow-[#915EFF]/30 transition-all transform active:scale-95'
              >
                Send Message ⬇
              </a>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default SectionWrapper(CallToAction, "");
