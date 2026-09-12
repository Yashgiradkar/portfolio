import React, { useState } from "react";
import { Tilt } from "react-tilt";
import { motion, AnimatePresence } from "framer-motion";

import { styles } from "../styles";
import { services } from "../constants";
import { Ideayaan } from "../assets";
import { SectionWrapper } from "../hoc";
import { fadeIn, textVariant } from "../utils/motion";

const ServiceCard = ({ index, title, description, icon }) => (
  <Tilt className='xs:w-[250px] w-full'>
    <motion.div
      variants={fadeIn("right", "spring", index * 0.4, 0.75)}
      className='w-full green-pink-gradient p-[1px] rounded-[20px] shadow-card'
    >
      <div
        options={{
          max: 45,
          scale: 1,
          speed: 450,
        }}
        className='bg-tertiary rounded-[20px] py-6 px-6 min-h-[290px] flex justify-evenly items-center flex-col text-center'
      >
        <img
          src={icon}
          alt={title}
          className='w-16 h-16 object-contain'
        />

        <h3 className='text-white text-[20px] font-bold'>
          {title}
        </h3>

        {description && (
          <p className='text-secondary text-[14px] leading-relaxed'>
            {description}
          </p>
        )}
      </div>
    </motion.div>
  </Tilt>
);

const About = () => {
  const [isZoomed, setIsZoomed] = useState(false);

  return (
    <>
      {/* 1. What I Build Section */}
      <motion.div variants={textVariant()}>
        <p className={styles.sectionSubText}>Introduction</p>
        <h2 className={styles.sectionHeadText}>What I Build.</h2>
      </motion.div>

      <motion.p
        variants={fadeIn("", "", 0.1, 1)}
        className='mt-4 text-secondary text-[17px] max-w-3xl leading-[30px]'
      >
        I build production-ready AI and backend systems that turn complex problems into intelligent, scalable products. From RAG and AI agents to LLM applications, microservices, and APIs.
      </motion.p>

      <div className='mt-16 flex flex-wrap gap-7 justify-center sm:justify-start'>
        {services.map((service, index) => (
          <ServiceCard key={service.title} index={index} {...service} />
        ))}
      </div>

      {/* 2. Beyond the Code */}
      <div className='mt-28'>
        <motion.div variants={textVariant()}>
          <p className={styles.sectionSubText}>Mindset & Approach</p>
          <h2 className={styles.sectionHeadText}>Beyond the Code.</h2>
        </motion.div>

        <motion.div
          variants={fadeIn("", "", 0.1, 1)}
          className='mt-4 text-secondary text-[16.5px] sm:text-[17px] max-w-3xl leading-[30px] space-y-3'
        >
          <p>
            <strong className='text-white font-semibold'>I start with the problem, not the technology.</strong>
          </p>
          <p>
            I listen, ask questions, challenge assumptions, and understand the people behind the requirement. Then I connect customer needs, product thinking, and technical possibilities to shape a solution—and communicate it clearly enough to bring people along.
          </p>
          <p className='text-white-100 font-medium italic text-[15.5px]'>
            I've approached problems this way since college, and it's still the mindset I bring to every project today.
          </p>
        </motion.div>

        {/* Proof of Product Thinking & Achievement */}
        <motion.div
          variants={fadeIn("up", "spring", 0.3, 0.75)}
          className='mt-10 bg-black-100 border border-[#915EFF]/30 rounded-2xl p-6 sm:p-8 flex flex-col lg:flex-row items-center gap-8 shadow-card'
        >
          {/* Zoomable Case Study Image */}
          <div
            className='relative group cursor-pointer w-full lg:w-[420px] flex-shrink-0 overflow-hidden rounded-xl bg-tertiary border border-white/10'
            onClick={() => setIsZoomed(true)}
          >
            <img
              src={Ideayaan}
              alt='HawkersCart 1st Prize — Ideayaan'
              className='w-full h-[240px] sm:h-[300px] object-cover transition-transform duration-500 group-hover:scale-105'
            />
            <div className='absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2 text-white font-medium text-sm backdrop-blur-[2px]'>
              <span className='bg-[#915EFF] px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-lg'>
                🔍 View Image
              </span>
            </div>
          </div>

          {/* Achievement Content */}
          <div className='flex-1 flex flex-col justify-center'>
            <div className='flex flex-wrap items-center gap-2 mb-3'>
              <span className='bg-[#915EFF]/20 border border-[#915EFF] text-white font-bold px-3 py-1 rounded-full text-xs'>
                🏆 1st Prize Winner
              </span>
              <span className='bg-tertiary border border-white/15 text-[#dfd9ff] font-semibold px-3 py-1 rounded-full text-xs'>
                80+ Competing Teams
              </span>
            </div>

            <h3 className='text-white text-[22px] sm:text-[25px] font-bold leading-tight'>
              HawkersCart — Hyperlocal Marketplace
            </h3>

            {/* Bullet Points */}
            <ul className='mt-4 space-y-3 text-secondary text-[14px] sm:text-[15px] leading-relaxed'>
              <li className='flex items-start gap-2.5'>
                <span className='text-[#915EFF] font-bold mt-1 text-base'>•</span>
                <span>
                  <strong className='text-white font-semibold'>Led Customer Discovery & Solution Design</strong> for <strong className='text-[#915EFF] font-semibold'>HawkersCart</strong>, a hyperlocal marketplace connecting street vegetable vendors directly with nearby households.
                </span>
              </li>

              <li className='flex items-start gap-2.5'>
                <span className='text-[#915EFF] font-bold mt-1 text-base'>•</span>
                <span>
                  <strong className='text-white font-semibold'>Identified Adoption Barriers</strong> across both user groups, translating real-world constraints into clear <strong className='text-white font-semibold'>Product and Technical Requirements</strong>.
                </span>
              </li>

              <li className='flex items-start gap-2.5'>
                <span className='text-[#915EFF] font-bold mt-1 text-base'>•</span>
                <span>
                  <strong className='text-white font-semibold'>Designed an End-to-End Solution</strong> combining <strong className='text-white font-semibold'>Location-Based Vendor Discovery</strong>, <strong className='text-white font-semibold'>Subscription Delivery</strong>.
                </span>
              </li>

              <li className='flex items-start gap-2.5'>
                <span className='text-[#915EFF] font-bold mt-1 text-base'>•</span>
                <span>
                  <strong className='text-white font-semibold'>Bridged Product & Business Strategy</strong> with practical implementation, leveraging <strong className='text-white font-semibold'>Product Thinking</strong> and <strong className='text-white font-semibold'>Technical Communication</strong> to pitch the winning solution.
                </span>
              </li>
            </ul>

            {/* Capability Hashtags / Competency Pills */}
            <div className='mt-6 flex flex-wrap gap-2'>
              {[
                "Problem Discovery",
                "Product Thinking",
                "Technical Thinking",
                "Communication",
                "Customer Discovery",
                "Solution Design",
              ].map((tag) => (
                <span
                  key={tag}
                  className='text-xs px-3 py-1.5 rounded-md bg-tertiary border border-[#915EFF]/25 text-[#dfd9ff] font-medium hover:border-[#915EFF] transition-colors'
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Lightbox Zoom Modal */}
      <AnimatePresence>
        {isZoomed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsZoomed(false)}
            className='fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-8 cursor-zoom-out'
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className='relative max-w-5xl max-h-[90vh] bg-tertiary p-2 rounded-2xl border border-white/20 shadow-2xl overflow-hidden'
            >
              <button
                onClick={() => setIsZoomed(false)}
                className='absolute top-4 right-4 z-10 bg-black/70 hover:bg-[#915EFF] text-white w-9 h-9 rounded-full flex items-center justify-center transition-colors text-lg font-bold'
                aria-label='Close preview'
              >
                ✕
              </button>

              <img
                src={Ideayaan}
                alt='HawkersCart Ideayaan Full View'
                className='w-full h-auto max-h-[85vh] object-contain rounded-xl'
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default SectionWrapper(About, "about");