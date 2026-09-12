import React from "react";
import { Tilt } from "react-tilt";
import { motion } from "framer-motion";

import { styles } from "../styles";
import { github } from "../assets";
import { SectionWrapper } from "../hoc";
import { projects } from "../constants";
import { fadeIn, textVariant } from "../utils/motion";

const ProjectCard = ({
  index,
  name,
  description,
  tags,
  image,
  source_code_link,
}) => {
  return (
    <motion.div variants={fadeIn("up", "spring", index * 0.5, 0.75)}>
      <Tilt
        options={{
          max: 45,
          scale: 1,
          speed: 450,
        }}
        className='bg-tertiary p-5 rounded-2xl sm:w-[360px] w-full'
      >
        <div className='relative w-full h-[230px]'>
          <img
            src={image}
            alt='project_image'
            className='w-full h-full object-cover rounded-2xl'
          />

          <div className='absolute inset-0 flex justify-end m-3 card-img_hover'>
            <div
              onClick={() => window.open(source_code_link, "_blank")}
              className='black-gradient w-10 h-10 rounded-full flex justify-center items-center cursor-pointer'
            >
              <img
                src={github}
                alt='source code'
                className='w-1/2 h-1/2 object-contain'
              />
            </div>
          </div>
        </div>

        <div className='mt-5'>
          <h3 className='text-white font-bold text-[24px]'>{name}</h3>
          <p className='mt-2 text-secondary text-[14px]'>{description}</p>
        </div>

        <div className='mt-4 flex flex-wrap gap-2'>
          {tags.map((tag) => (
            <p
              key={`${name}-${tag.name}`}
              className={`text-[14px] ${tag.color}`}
            >
              #{tag.name}
            </p>
          ))}
        </div>
      </Tilt>
    </motion.div>
  );
};

const Works = () => {
  return (
    <>
      <motion.div variants={textVariant()}>
        <p className={`${styles.sectionSubText} `}>My work</p>
        <h2 className={`${styles.sectionHeadText}`}>Projects.</h2>
      </motion.div>

      <div className='w-full flex'>
        <motion.div
          variants={fadeIn("", "", 0.1, 1)}
          className='mt-4 max-w-4xl space-y-6'
        >
          {/* Engineering Manifesto Callout */}
          <div className='relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#915EFF]/30 via-tertiary to-black-100 p-[1px] shadow-card'>
            <div className='bg-tertiary/90 backdrop-blur-md px-6 py-5 rounded-2xl border-l-4 border-[#915EFF] flex items-start gap-4'>
              <span className='flex h-3 w-3 rounded-full bg-[#915EFF] animate-ping mt-1.5 flex-shrink-0' />
              <div className='space-y-1'>
                <p className='text-[16px] sm:text-[18px] text-white font-bold leading-snug tracking-tight'>
                  <span className='text-secondary font-normal'>Claims are easy. </span>
                  <span className='text-white underline decoration-[#915EFF] decoration-2 underline-offset-4'>
                    Working systems are the proof
                  </span>
                  <span className='text-[#915EFF] font-bold mx-1.5'>—</span>
                  <span className='text-[#dfd9ff] font-medium'>
                    and while technologies evolve, good engineering never goes out of date.
                  </span>
                </p>
              </div>
            </div>
          </div>

          <div className='text-secondary text-[16px] sm:text-[16.5px] leading-[30px] space-y-3'>
            <p>
              My projects reflect the evolution of my engineering journey—from building my first Android application to designing{" "}
              <strong className='text-white font-medium'>
                full-stack products, cloud infrastructure, and production-oriented AI applications
              </strong>
              .
            </p>
            <p>
              Across different stacks and generations of technology, one thing has remained constant:{" "}
              <strong className='text-white font-medium'>
                the ability to learn, adapt, solve problems, and ship.
              </strong>
            </p>
            <p>
              These projects are not just a list of technologies I've used. They show how my engineering scope has grown—from{" "}
              <strong className='text-white font-medium'>building features</strong>, to{" "}
              <strong className='text-white font-medium'>designing systems</strong>, to{" "}
              <strong className='text-white font-medium'>
                thinking about scalability, reliability, deployment, performance, and real-world AI workloads
              </strong>
              .
            </p>
          </div>
        </motion.div>
      </div>

      <div className='mt-20 flex flex-wrap gap-7'>
        {projects.map((project, index) => (
          <ProjectCard key={`project-${index}`} index={index} {...project} />
        ))}
      </div>
    </>
  );
};

export default SectionWrapper(Works, "");