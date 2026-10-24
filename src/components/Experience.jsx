import React from "react";
import {
  VerticalTimeline,
  VerticalTimelineElement,
} from "react-vertical-timeline-component";
import { motion } from "framer-motion";

import "react-vertical-timeline-component/style.min.css";

import { styles } from "../styles";
import { experiences } from "../constants";
import { SectionWrapper } from "../hoc";
import { textVariant, fadeIn } from "../utils/motion";

const transformations = [
  {
    from: "“Why isn't this working?”",
    to: "“How do we keep this working in production?”",
    tag: "Mindset Shift",
  },
  {
    from: "Bug fixes to isolated patches",
    to: "Writing code to owning what happens after it ships",
    tag: "End-to-End Ownership",
  },
  {
    from: "“I wrote the code”",
    to: "“I own what happens in production.”",
    tag: "Accountability",
  },
];

const productionRealities = [
  { label: "Bugs in Production", icon: "🚨" },
  { label: "API Latency Spikes", icon: "⚡" },
  { label: "Data Integrity Recovery", icon: "💾" },
  { label: "Unresponsive Services", icon: "🛑" },
  { label: "Zero-Downtime Hotfixes", icon: "🔥" },
];

const ExperienceCard = ({ experience }) => {
  return (
    <VerticalTimelineElement
      contentStyle={{
        background: "#1b150e",
        color: "#fff",
      }}
      contentArrowStyle={{ borderRight: "7px solid #2b2115" }}
      date={experience.date}
      iconStyle={{ background: experience.iconBg, boxShadow: "0 0 0 4px rgba(214, 168, 75, 0.38), 0 0 22px rgba(214, 168, 75, 0.22)" }}
      icon={
        <motion.div
          initial={{ scale: 0.7, rotate: -12, opacity: 0 }}
          whileInView={{ scale: 1, rotate: 0, opacity: 1 }}
          viewport={{ once: true, amount: 0.7 }}
          transition={{ type: "spring", stiffness: 220, damping: 16 }}
          className='flex justify-center items-center w-full h-full'
        >
          <img
            src={experience.icon}
            alt={experience.company_name}
            className='w-[60%] h-[60%] object-contain'
          />
        </motion.div>
      }
    >
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <h3 className='text-white text-[24px] font-bold'>{experience.title}</h3>
        <p
          className='text-secondary text-[16px] font-semibold'
          style={{ margin: 0 }}
        >
          {experience.company_name}
        </p>
      </motion.div>

      <ul className='mt-5 list-disc ml-5 space-y-2'>
        {experience.points.map((point, index) => (
          <motion.li
            key={`experience-point-${index}`}
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ delay: 0.12 + index * 0.1, duration: 0.35, ease: "easeOut" }}
            className='text-white-100 text-[14px] pl-1 tracking-wider leading-relaxed'
          >
            {point}
          </motion.li>
        ))}
      </ul>
    </VerticalTimelineElement>
  );
};

const Experience = () => {
  return (
    <>
      <motion.div variants={textVariant()}>
        <p className={`${styles.sectionSubText}`}>
          Engineering in Production
        </p>
        <h2 className={`${styles.sectionHeadText}`}>
          Work Experience.
        </h2>
      </motion.div>

      {/* Unique Transformation Punchlines */}
      <motion.div
        variants={fadeIn("up", "spring", 0.2, 0.75)}
        className='mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-6xl'
      >
        {transformations.map((item, index) => (
          <div
            key={`transformation-${index}`}
            className='relative overflow-hidden rounded-2xl bg-gradient-to-b from-gold/25 via-tertiary to-black-100 p-[1px] shadow-card'
          >
            <div className='bg-tertiary/90 backdrop-blur-md p-5 rounded-2xl h-full flex flex-col justify-between border-t-2 border-gold'>
              <div className='flex justify-between items-center mb-3'>
                <span className='text-[11px] font-mono font-bold text-[#f2dfbd] uppercase tracking-wider bg-black-100/70 px-2.5 py-0.5 rounded-full border border-white/10'>
                  {item.tag}
                </span>
                <motion.span animate={{ scale: [1, 1.8, 1] }} transition={{ duration: 1.8, repeat: Infinity, delay: index * 0.2 }} className='h-2 w-2 rounded-full bg-gold shadow-[0_0_12px_rgba(255,215,132,0.9)]' />
              </div>

              <div className='space-y-2'>
                <div className='text-secondary text-xs sm:text-[13px] flex items-center gap-1.5'>
                  <span className='text-red-400/80 font-mono'>FROM:</span>
                  <span className='line-through decoration-red-400/60 font-medium'>
                    {item.from}
                  </span>
                </div>

                <div className='text-white text-sm sm:text-[14.5px] font-bold leading-snug flex items-start gap-1.5'>
                  <span className='text-green-400 font-mono text-xs mt-0.5'>TO:</span>
                  <span className='text-[#f2dfbd] group-hover:text-white transition-colors'>
                    {item.to}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Unique Production Engineering Reality Card */}
      <div className='w-full flex justify-center mt-12'>
        <motion.div
          variants={fadeIn("up", "spring", 0.3, 0.75)}
          className='w-full max-w-4xl relative overflow-hidden rounded-2xl bg-gradient-to-r from-gold/20 via-tertiary/60 to-gold/20 p-[1px] shadow-card'
        >
          <div className='bg-tertiary/90 backdrop-blur-lg p-6 sm:p-8 rounded-2xl flex flex-col items-center text-center space-y-6'>
            {/* Header Badge */}
            <div className='inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-black-100/80 border border-gold/30 text-xs font-mono font-semibold text-[#f2dfbd]'>
              <span className='w-2 h-2 rounded-full bg-emerald-400 animate-pulse' />
              BEYOND THE TUTORIALS • PRODUCTION REALITIES
            </div>

            {/* Narrative Paragraph 1 */}
            <p className='text-secondary text-[16px] sm:text-[17px] leading-[30px] max-w-3xl'>
              My experience has taken me from learning how to build software to understanding what it takes to{" "}
              <strong className='text-white font-semibold'>
                run, debug, optimize, recover, and evolve it in the real world
              </strong>
              .
            </p>

            {/* Interactive Real-World Problem Chips */}
            <div className='w-full py-2'>
              <p className='text-xs text-secondary/80 uppercase font-mono tracking-wider mb-3'>
                What Tutorials Never Teach You:
              </p>
              <div className='flex flex-wrap justify-center gap-2.5'>
                {productionRealities.map((reality, idx) => (
                  <span
                    key={`reality-${idx}`}
                    className='inline-flex items-center gap-1.5 text-xs sm:text-[13px] font-medium px-3.5 py-1.5 rounded-lg bg-black-100/90 border border-white/10 text-white-100 hover:border-gold hover:text-white transition-colors duration-200'
                  >
                    <motion.span whileHover={{ rotate: [0, -10, 10, 0], scale: 1.18 }} transition={{ duration: 0.35 }}>{reality.icon}</motion.span>
                    <span>{reality.label}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Narrative Takeaway Quote */}
            <div className='pt-4 border-t border-white/10 w-full'>
              <p className='text-[#f2dfbd] text-[15px] sm:text-[16px] leading-[28px] max-w-3xl mx-auto'>
                Debugging what breaks, responding to production issues, optimizing what is slow, and making systems more resilient after every failure—
                <strong className='text-white font-bold underline decoration-gold decoration-2 underline-offset-4 ml-1'>
                  that's where I've grown
                </strong>
                , not just as a developer, but as an engineer who thinks beyond the code and takes complete ownership of the system.
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Timeline Section */}
      <div className='mt-16 flex flex-col'>
        <VerticalTimeline animate={true} lineColor='#d6a84b'>
          {experiences.map((experience, index) => (
            <ExperienceCard
              key={`experience-${index}`}
              experience={experience}
            />
          ))}
        </VerticalTimeline>
      </div>
    </>
  );
};

export default SectionWrapper(Experience, "experience");
