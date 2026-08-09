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
    emailNewsletter,
    fastApi,
    Docker,
    Langchain,
    smartData,
    Kaliba,
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
        title: "Gen AI Developer",
        icon: web,
    },
    {
        title: "Backend Developer",
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
        name: "HTML5",
        icon: html,
    },
    {
        name: "CSS3",
        icon: css,
    },
    {
        name: "JavaScript",
        icon: javascript,
    },
    {
        name: "React.js",
        icon: reactjs,
    },
    {
        name: "Tailwind CSS",
        icon: tailwind,
    },
    {
        name: "Node.js",
        icon: nodejs,
    },
    {
        name: "MongoDB",
        icon: mongodb,
    },
    {
        name: "Docker",
        icon: Docker,
    },
    {
        name: "Git",
        icon: git,
    },
    {
        name: "LangChain",
        icon: Langchain,
    },
    {
        name: "Three.js",
        icon: threejs,
    },
];

const experiences = [
    {
        title: "Software Associate Level II",
        company_name: "SmartData Enterprises",
        icon: smartData,
        iconBg: "#383E56",
        date: "September 2024 - Present",
        points: [
            "Architected and maintained a high-performance NestJS API Gateway, improving microservices routing efficiency by 25% while enabling secure, low-latency communication across distributed services.",

            "Engineered zero-downtime MongoDB data migrations across production microservices, preserving 100% data integrity during complex backend architecture and schema upgrades.",

            "Designed scalable backend services using Node.js, Express.js, and MongoDB, leveraging multi-stage aggregation pipelines to automate complex business workflows and conditional entity deletion while maintaining data consistency.",
        ],
    },
    {
        title: "Web Developer Intern",
        company_name: "Kaliba Enterprises",
        icon: Kaliba,
        iconBg: "#E6DEDD",
        date: "January 2024 - June 2024",
        points: [
            "Developed interactive, data-driven dashboards and visualizations using Syncfusion, transforming complex datasets into intuitive charts and actionable insights.",

            "Built responsive and reusable UI components with Tailwind CSS and integrated backend APIs to dynamically fetch, process, and render application data across responsive interfaces.",

            "Implemented efficient application state management and optimized frontend components to deliver smooth user interactions, consistent UI behavior, and maintainable web experiences.",
        ],
    },
    {
        title: "Full Stack Developer (Trainee)",
        company_name: "Whitehorse Business Solutions",
        icon: whitehorse,
        iconBg: "#383E56",
        date: "July 2023 - August 2023",
        points: [
            "Developed responsive web interfaces using HTML, CSS, and JavaScript, implementing interactive functionality and user-focused experiences.",
            "Built server-side functionality using Node.js and Express.js, integrating MongoDB for efficient and reliable data storage.",
            "Worked across the frontend and backend stack to transform requirements into functional web applications while focusing on usability and maintainability.",
        ],
    },
    {
        title: "Software Tester",
        company_name: "S2P Edutech",
        icon: s2p,
        iconBg: "#383E56",
        date: "August 2022 - September 2022",
        points: [
            "Performed manual testing of REST APIs using Postman, validating request methods, response payloads, status codes, and API behavior.",
            "Automated API test cases using Jest, improving testing efficiency and helping identify functional issues during development.",
            "Prepared test cases and reports while validating JSON payloads and ensuring API responses met expected requirements.",
        ],
    },
    {
        title: "Campus Treasurer",
        company_name:
            "Institute of Electrical and Electronics Engineers (IEEE)",
        icon: ieee,
        iconBg: "#E6DEDD",
        date: "January 2022 - January 2023",
        points: [
            "Organized technical workshops and seminars for students, coordinating activities and supporting successful event execution.",
            "Collaborated with team members on event planning and execution, strengthening communication, teamwork, leadership, and organizational skills.",
            "Developed professional networking skills through coordination with students, faculty, and IEEE members.",
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
        name: "Byte Email Newsletter Platform",
        description:
            "Developed a web application using Next.js and TypeScript, integrating Clerk for authentication. The zeroBounce API ensures email verification accuracy. Additionally, I implemented AstraDB for data storage and offered users the ability to customize their profiles. The application features three distinct pricing plans, managed through Stripe webhook integration. AWS SES enables users to receive transactional emails seamlessly.",
        tags: [
            {
                name: "NextJS",
                color: "blue-text-gradient",
            },
            {
                name: "Typescript",
                color: "green-text-gradient",
            },
            {
                name: "AWS SES",
                color: "pink-text-gradient",
            },
            {
                name: "Stripe",
                color: "green-text-gradient",
            },
            {
                name: "AstraDB",
                color: "blue-text-gradient",
            },
        ],
        image: emailNewsletter,
        source_code_link: "https://github.com/",
    },
    {
        name: "Country List Api",
        description:
            "Created high-performance API with Hono and Cloudflare Workers for globally distributed serverless code execution. The project used Redis as a fast database solution, ensuring excellent performance and scalability.",
        tags: [
            {
                name: "Hono",
                color: "blue-text-gradient",
            },
            {
                name: "Cloudflare",
                color: "green-text-gradient",
            },
            {
                name: "Redis",
                color: "pink-text-gradient",
            },
        ],
        image: fastApi,
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
    // {
    //     name: "Virtual Assistant CLI",
    //     description:
    //         "It is an application program that operates on a command line interface and understands voice commands in order to perform tasks on behalf of the user",
    //     tags: [
    //         {
    //             name: "Python",
    //             color: "blue-text-gradient",
    //         },
    //     ],
    //     image: virtualAssistant,
    //     source_code_link: "https://github.com/",
    // },

];

export { services, technologies, experiences, testimonials, projects };