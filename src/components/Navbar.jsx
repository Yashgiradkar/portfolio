import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { styles } from "../styles";
import { navLinks } from "../constants";
import { logo, menu, close } from "../assets";

const Navbar = () => {
  const [active, setActive] = useState("");
  const [toggle, setToggle] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollTop = window.scrollY;
          setScrolled(scrollTop > 100);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`${styles.paddingX
        } w-full flex items-center py-5 fixed top-0 z-20 ${scrolled ? "bg-primary/95 backdrop-blur-sm" : "bg-transparent"
        } transition-colors duration-300`}
    >
      <div className='w-full flex justify-between items-center max-w-7xl mx-auto'>
        <Link
          to='/'
          className='flex items-center gap-2'
          aria-label='Yash Portfolio Home'
          onClick={() => {
            setActive("");
            window.scrollTo(0, 0);
          }}
        >
          <span className='relative flex h-10 w-10 items-center justify-center rounded-full border border-gold/50 bg-gold/10 shadow-[0_0_18px_rgba(214,168,75,0.14)]'>
            <img src={logo} alt='Yash Logo' width='36' height='36' className='w-8 h-8 object-contain' />
          </span>
          <p className='text-white text-[18px] font-bold cursor-pointer flex '>
            <span className='sm:block hidden'>Engineering What’s Next</span>
          </p>
        </Link>

        <ul className='list-none hidden sm:flex flex-row gap-10'>
          {navLinks.map((nav) => (
            <li
              key={nav.id}
              className={`${active === nav.title ? "text-gold-light" : "text-secondary"
                } hover:text-gold-light text-[18px] font-medium cursor-pointer transition-colors relative after:absolute after:-bottom-2 after:left-0 after:h-px after:w-full after:origin-left after:bg-gold after:scale-x-0 hover:after:scale-x-100 after:transition-transform`}
              onClick={() => setActive(nav.title)}
            >
              <a href={`#${nav.id}`}>{nav.title}</a>
            </li>
          ))}
        </ul>

        <div className='sm:hidden flex flex-1 justify-end items-center'>
          <button
            type='button'
            aria-label='Toggle navigation menu'
            aria-expanded={toggle}
            className='bg-transparent border-none outline-none cursor-pointer p-1'
            onClick={() => setToggle(!toggle)}
          >
            <img
              src={toggle ? close : menu}
              alt='menu toggle'
              width='28'
              height='28'
              className='w-[28px] h-[28px] object-contain'
            />
          </button>

          <div
            className={`${!toggle ? "hidden" : "flex"
              } p-6 black-gradient absolute top-20 right-0 mx-4 my-2 min-w-[140px] z-10 rounded-xl`}
          >
            <ul className='list-none flex justify-end items-start flex-1 flex-col gap-4'>
              {navLinks.map((nav) => (
                <li
                  key={nav.id}
                  className={`font-poppins font-medium cursor-pointer text-[16px] ${active === nav.title ? "text-white" : "text-secondary"
                    }`}
                  onClick={() => {
                    setToggle(!toggle);
                    setActive(nav.title);
                  }}
                >
                  <a href={`#${nav.id}`}>{nav.title}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
