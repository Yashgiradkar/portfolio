import React, { useState } from "react";
import { Tilt } from "react-tilt";
import { motion, AnimatePresence } from "framer-motion";

import { styles } from "../styles";
import { services } from "../constants";
import { Ideayaan } from "../assets";
import { SectionWrapper } from "../hoc";
import { fadeIn, textVariant } from "../utils/motion";

const ServiceIcon = ({ title }) => {
  const svgProps = { viewBox: "0 0 72 72", fill: "none", stroke: "currentColor", strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round", className: "h-16 w-16 text-gold-light" };
  if (title === "AI Agents") return <svg {...svgProps}><circle cx="36" cy="36" r="10" /><circle cx="17" cy="22" r="5" /><circle cx="55" cy="22" r="5" /><circle cx="17" cy="52" r="5" /><circle cx="55" cy="52" r="5" /><path d="m21 25 8 7m22-7-8 7m-22 17 8-7m22 7-8-7" /></svg>;
  if (title === "RAG Systems") return <svg {...svgProps}><path d="M17 17h24l14 14v24H17z" /><path d="M41 17v14h14M25 38h22M25 47h16" /><circle cx="17" cy="53" r="6" /><path d="m21 50 8-4" /></svg>;
  if (title === "LLM Applications") return <svg {...svgProps}><rect x="14" y="14" width="44" height="44" rx="8" /><path d="M27 29h18M27 36h10M27 43h14" /><path d="m48 48 5 5m0-5-5 5" /></svg>;
  return <svg {...svgProps}><rect x="12" y="16" width="20" height="16" rx="3" /><rect x="40" y="16" width="20" height="16" rx="3" /><rect x="26" y="42" width="20" height="16" rx="3" /><path d="M22 32v5h28v-5M36 37v5" /></svg>;
};

const mindsetContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};

const mindsetItem = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" } },
};

const ServiceCard = ({ index, title, description }) => (
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
        <motion.div whileHover={{ y: -5, rotate: 4 }} transition={{ type: "spring", stiffness: 280 }} className='relative'>
          <span className='absolute -inset-3 rounded-full bg-gold/10 blur-xl' />
          <ServiceIcon title={title} />
        </motion.div>

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
      <motion.div
        className='mt-28'
        variants={mindsetContainer}
        initial='hidden'
        whileInView='show'
        viewport={{ once: true, amount: 0.2 }}
      >
        <motion.div variants={mindsetItem}>
          <p className={styles.sectionSubText}>Mindset & Approach</p>
          <h2 className={styles.sectionHeadText}>Beyond the Code.</h2>
        </motion.div>

        <motion.div
          variants={mindsetItem}
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
          variants={mindsetItem}
          whileHover={{ y: -4, borderColor: "rgba(214, 168, 75, 0.6)" }}
          transition={{ duration: 0.3 }}
          className='mt-10 bg-black-100 border border-gold/30 rounded-2xl p-6 sm:p-8 flex flex-col lg:flex-row items-center gap-8 shadow-card transition-shadow hover:shadow-[0_35px_120px_-15px_rgba(214,168,75,0.18)]'
        >
          {/* Zoomable Case Study Image */}
          <div
            className='relative group cursor-pointer w-full lg:w-[420px] flex-shrink-0 overflow-hidden rounded-xl bg-tertiary border border-white/10'
            onClick={() => setIsZoomed(true)}
          >
            <motion.img
              initial={{ scale: 1.1, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease: "easeOut", delay: 0.18 }}
              src={Ideayaan}
              alt='HawkersCart 1st Prize — Ideayaan Award'
              loading='lazy'
              decoding='async'
              width='420'
              height='300'
              className='w-full h-[240px] sm:h-[300px] object-cover transition-transform duration-500 group-hover:scale-105'
            />
            <div className='absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2 text-white font-medium text-sm backdrop-blur-[2px]'>
              <span className='bg-gold px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-lg text-[#17130e]'>
                🔍 View Image
              </span>
            </div>
          </div>

          {/* Achievement Content */}
          <div className='flex-1 flex flex-col justify-center'>
            <div className='flex flex-wrap items-center gap-2 mb-3'>
              <motion.span initial={{ opacity: 0, x: 14 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.25, duration: 0.35 }} className='bg-gold/20 border border-gold text-gold-light font-bold px-3 py-1 rounded-full text-xs'>
                🏆 1st Prize Winner
              </motion.span>
              <motion.span initial={{ opacity: 0, x: 14 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.34, duration: 0.35 }} className='bg-tertiary border border-white/15 text-[#f2dfbd] font-semibold px-3 py-1 rounded-full text-xs'>
                80+ Competing Teams
              </motion.span>
            </div>

            <h3 className='text-white text-[22px] sm:text-[25px] font-bold leading-tight'>
              HawkersCart — Hyperlocal Marketplace
            </h3>

            {/* Bullet Points */}
            <motion.ul variants={mindsetContainer} className='mt-4 space-y-3 text-secondary text-[14px] sm:text-[15px] leading-relaxed'>
              <li className='flex items-start gap-2.5'>
                <span className='text-gold font-bold mt-1 text-base'>•</span>
                <span>
                  <strong className='text-white font-semibold'>Led Customer Discovery & Solution Design</strong> for <strong className='text-gold-light font-semibold'>HawkersCart</strong>, a hyperlocal marketplace connecting street vegetable vendors directly with nearby households.
                </span>
              </li>

              <li className='flex items-start gap-2.5'>
                <span className='text-gold font-bold mt-1 text-base'>•</span>
                <span>
                  <strong className='text-white font-semibold'>Identified Adoption Barriers</strong> across both user groups, translating real-world constraints into clear <strong className='text-white font-semibold'>Product and Technical Requirements</strong>.
                </span>
              </li>

              <li className='flex items-start gap-2.5'>
                <span className='text-gold font-bold mt-1 text-base'>•</span>
                <span>
                  <strong className='text-white font-semibold'>Designed an End-to-End Solution</strong> combining <strong className='text-white font-semibold'>Location-Based Vendor Discovery</strong>, <strong className='text-white font-semibold'>Subscription Delivery</strong>.
                </span>
              </li>

              <li className='flex items-start gap-2.5'>
                <span className='text-gold font-bold mt-1 text-base'>•</span>
                <span>
                  <strong className='text-white font-semibold'>Bridged Product & Business Strategy</strong> with practical implementation, leveraging <strong className='text-white font-semibold'>Product Thinking</strong> and <strong className='text-white font-semibold'>Technical Communication</strong> to pitch the winning solution.
                </span>
              </li>
            </motion.ul>

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
                <motion.span
                  key={tag}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  whileHover={{ y: -2, borderColor: "rgba(214, 168, 75, 0.8)" }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.35 + (tag.length * 0.008), duration: 0.25 }}
                  className='text-xs px-3 py-1.5 rounded-md bg-tertiary border border-gold/25 text-[#f2dfbd] font-medium hover:border-gold transition-colors'
                >
                  #{tag}
                </motion.span>
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>

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
                className='absolute top-4 right-4 z-10 bg-black/70 hover:bg-gold text-white hover:text-[#17130e] w-9 h-9 rounded-full flex items-center justify-center transition-colors text-lg font-bold'
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
