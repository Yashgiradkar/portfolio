import {
    mobile,
    backend,
    creator,
    web,
    javascript,
    html,
    css,
    reactjs,
    tailwind,
    nodejs,
    mongodb,
    git,
    whitehorse,
    ieee,
    s2p,
    androidApp,
    dashboard,
    devOps,
    productSite,
    algoTrading,
    virtualAssistant,
    threejs,
} from "../assets";

export const navLinks = [
    {
        id: "about",
        title: "About",
    },
    {
        id: "work",
        title: "Work",
    },
    {
        id: "contact",
        title: "Contact",
    },
];

const services = [
    {
        title: "Backend Developer",
        icon: web,
    },
    {
        title: "Frontend Developer",
        icon: backend,
    },
    {
        title: "Full Stack Developer",
        icon: mobile,
    },
    {
        title: "DevOps Developer",
        icon: creator,
    },
];

const technologies = [
    {
        name: "HTML 5",
        icon: html,
    },
    {
        name: "CSS 3",
        icon: css,
    },
    {
        name: "JavaScript",
        icon: javascript,
    },
    {
        name: "React JS",
        icon: reactjs,
    },
    {
        name: "Tailwind CSS",
        icon: tailwind,
    },
    {
        name: "Node JS",
        icon: nodejs,
    },
    {
        name: "MongoDB",
        icon: mongodb,
    },
    {
        name: "Three JS",
        icon: threejs,
    },
    {
        name: "git",
        icon: git,
    }
    
];

const experiences = [
    {
        title: "Full Stack Developer (Trainee)",
        company_name: "Whitehorse Business Solutions",
        icon: whitehorse,
        iconBg: "#383E56",
        date: "July 2023 - Aug 2023",
        points: [
            "Transformed ideas into captivating web pages using HTML and CSS andJavaScript's logic for interactivity. I rely on Node.js and Express.js to drive the server, while MongoDB ensures secure and efficient data storage for each project.crafted elegant user- experience, optimizing user journeys.",
        ],
    },
    {
        title: "Software Tester",
        company_name: "S2P Edutech",
        icon: s2p,
        iconBg: "#383E56",
        date: "Aug 2022 - Sep 2022",
        points: [
            "Manually tested REST Api requests with Postman and automated tested requests with Jest Framework,Test Cases Report, Json Objects",
        ],
    },
    {
        title: "Campus Treasurer",
        company_name: "Institute of Electrical and Electronics Engineers (IEEE)",
        icon: ieee,
        iconBg: "#E6DEDD",
        date: "Jan 2022 - Jan 2023",
        points: [
            "Learned to Organize workshops and seminars which is helpful for students, learned working in team, Improved Communication, Developed Networking Skills",
        ],
    },
    
];

const testimonials = [
    {
        testimonial:
            "He is prompt in doing tasks, does his assigned work before time and learned through resolving errors",
        name: "Gandhar Patwardhan",
        designation: "CEO",
        company: "S2P Edutech",
        image: "https://randomuser.me/api/portraits/men/5.jpg",
    },
    {
        testimonial:
            "Whenever we ask him to perform a task, he does it quickly and efficiently. Highly talented programmer. My go-to person, and he has never failed to deliver what I have asked for. An individual who is intelligent, trustworthy, and professional.",
        name: "Mrudula Nimbharte",
        designation: "HOD CSE",
        company: "S. B. Jain Institute",
        image: "https://randomuser.me/api/portraits/women/4.jpg",
    },
    {
        testimonial:
            "Have seen good leadership, team player skills. Always self-motivated and he is committed to lifelong learning!",
        name: "Sohel Sheikh",
        designation: "Managing Director",
        company: "Whitehorse Business Solutions",
        image: "https://randomuser.me/api/portraits/women/6.jpg",
    },
];

const projects = [
    {
        name: "Admin Dashboard",
        description:
            "A web-based platform that allows users to access dashboards, a variety of charts, apps such as editors, calendars, as well as different pages where information can be created, edited or deleted, with dark mode.",
        tags: [
            {
                name: "react",
                color: "blue-text-gradient",
            },
            {
                name: "sync fusion",
                color: "green-text-gradient",
            },
            {
                name: "tailwind",
                color: "pink-text-gradient",
            },
        ],
        image: dashboard,
        source_code_link: "https://github.com/",
    },
    
    {
        name: "Vercel Counting System",
        description:
            " Implemented an end-to-end system using AWS S3 for efficient storage of files in a secure bucket.Automated build process and deployment of the application using Docker.Utilized Redis to implement a robust publish/subscribe mechanism within the server. Employed a reverse proxy to effectively manage and control the flow of network traffic.",
        tags: [
            {
                name: "AWS S3",
                color: "blue-text-gradient",
            },
            {
                name: "Docker",
                color: "green-text-gradient",
            },
            {
                name: "Redis",
                color: "pink-text-gradient",
            },
            {
                name: "Nginx",
                color: "blue-text-gradient",
            },
            {
                name: "React",
                color: "green-text-gradient",
            }
        ],
        image: devOps,
        source_code_link: "https://github.com/",
    },
    {
        name: "3d Product Site",
        description:
            "  This web application allows users to choose shirt colors and logo, can also upload the logo or shirt gradient, color from your device and uses AI to genereate unique images for logos and shirt colors.",
        tags: [
            {
                name: "react",
                color: "blue-text-gradient",
            },
            {
                name: "tailwindcss",
                color: "green-text-gradient",
            },
            {
                name: "threejs",
                color: "pink-text-gradient",
            },
        ],
        image: productSite,
        source_code_link: "https://github.com/",
    },
    {
        name: "Tic Tac Toe App",
        description:
            "A simple android application where two players draw Xs and Os inside nine squares, and each player tries to fill a row of squares with either an X or an O",
        tags: [
            {
                name: "Android Studio",
                color: "blue-text-gradient",
            },
            {
                name: "Java",
                color: "green-text-gradient",
            },
            {
                name: "XML",
                color: "pink-text-gradient",
            },
        ],
        image: androidApp,
        source_code_link: "https://github.com/",
    },
    {
        name: "Algorithm Trading CLI",
        description:
            "It is based on a platform that builds programs that develop hypotheses for strategies using a command line interface and the IEX cloud API to perform tasks on the platform",
        tags: [
            {
                name: "Python",
                color: "blue-text-gradient",
            },
            {
                name: "IEX Cloud API",
                color: "green-text-gradient",
            },
        ],
        image: algoTrading,
        source_code_link: "https://github.com/",
    },
    {
        name: "Virtual Assistant CLI",
        description:
            "It is an application program that operates on a command line interface and understands voice commands in order to perform tasks on behalf of the user",
        tags: [
            {
                name: "Python",
                color: "blue-text-gradient",
            },
        ],
        image: virtualAssistant,
        source_code_link: "https://github.com/",
    },
    
];

export { services, technologies, experiences, testimonials, projects };