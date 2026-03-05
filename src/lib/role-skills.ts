
export const PLACEMENT_ROLES = [
    // IT / CSE
    "Frontend Developer",
    "Backend Developer",
    "Full Stack Developer",
    "Java Developer",
    "Python Developer",
    "AI/ML Engineer",
    "DevOps Engineer",

    // Mechanical
    "Design Engineer",
    "Production Engineer",
    "Thermal Engineer",
    "Quality Engineer",

    // Civil
    "Structural Engineer",
    "Site Engineer",
    "Environmental Engineer",
    "Project Planning Engineer",

    // EEE
    "Power Systems Engineer",
    "Control Systems Engineer",
    "Electrical Design Engineer",
    "Embedded Systems (Hybrid)",

    // ECE
    "Embedded Systems Engineer",
    "VLSI Engineer",
    "Communication Engineer",
    "IoT Engineer",

    // Mechatronics
    "Robotics Engineer",
    "Automation Engineer",
    "Industrial IoT Engineer",

    // Common / Transition
    "IT Transition Track",
    "Generalist"
] as const;

export type PlacementRole = typeof PLACEMENT_ROLES[number];

export interface RoleSkillMatrix {
    core: string[];
    intermediate: string[];
    advanced: string[];
}

export const ROLE_SKILL_MATRIX: Record<PlacementRole, RoleSkillMatrix> = {
    // IT Roles
    "Frontend Developer": {
        core: ["HTML", "CSS", "JavaScript", "Responsive Design", "Git"],
        intermediate: ["React.js", "Tailwind CSS", "REST APIs", "TypeScript", "State Management"],
        advanced: ["Next.js", "Performance Optimization", "WebSockets", "Testing", "CI/CD"]
    },
    "Backend Developer": {
        core: ["Node.js", "Express.js", "SQL Basics", "REST APIs", "Git"],
        intermediate: ["MongoDB/PostgreSQL", "Auth (JWT/OAuth)", "Docker", "Redis", "Unit Testing"],
        advanced: ["Microservices", "GraphQL", "System Design", "Cloud Basics", "CI/CD"]
    },
    "Full Stack Developer": {
        core: ["HTML/CSS/JS", "React Basics", "Node.js Basics", "SQL/NoSQL", "Git"],
        intermediate: ["Next.js/MERN", "API Design", "Authentication", "Database Modeling", "Docker"],
        advanced: ["Scalable Architecture", "Serverless", "Advanced State", "Cloud Deployment", "Security"]
    },
    "Java Developer": {
        core: ["Java Basics", "OOPs Concepts", "Collections", "Exception Handling", "Git"],
        intermediate: ["Spring Boot", "Hibernate/JPA", "REST APIs", "SQL", "Multithreading"],
        advanced: ["Microservices", "Spring Security", "Kafka", "Docker/K8s", "System Design"]
    },
    "Python Developer": {
        core: ["Python Syntax", "Data Structures", "OOPs", "File Handling", "Git"],
        intermediate: ["Django/Flask", "REST APIs", "SQLAlchemy", "Pandas Basics", "Testing"],
        advanced: ["AsyncIO", "Celery", "FastAPI", "Cloud integration", "System Design"]
    },
    "AI/ML Engineer": {
        core: ["Python", "Linear Algebra", "Calculus/Stats", "NumPy/Pandas", "Git"],
        intermediate: ["Scikit-Learn", "Data Viz", "Supervised Learning", "Unsupervised Learning", "SQL"],
        advanced: ["Deep Learning", "NLP/Computer Vision", "Model Deployment", "MLOps", "GenAI"]
    },
    "DevOps Engineer": {
        core: ["Linux", "Shell Scripting", "Git", "Networking", "Python/Go"],
        intermediate: ["Docker", "CI/CD (Jenkins/Actions)", "Cloud (AWS/Azure)", "Monitoring", "Grafana"],
        advanced: ["Kubernetes", "Terraform", "Ansible", "DevSecOps", "SRE"]
    },

    // Mechanical Roles
    "Design Engineer": {
        core: ["Engineering Mechanics", "Strength of Materials", "CAD Basics", "Machine Design", "Git"],
        intermediate: ["SolidWorks", "AutoCAD", "DFM/DFA", "Materials Science", "Fluid Mechanics"],
        advanced: ["FEA/ANSYS", "CFD Basics", "Precision Engineering", "GD&T", "Product Lifecycle Management"]
    },
    "Production Engineer": {
        core: ["Manufacturing Process", "Industrial Engineering", "Metrology", "Quality Control", "Git"],
        intermediate: ["Lean Manufacturing", "Six Sigma", "Operations Research", "Supply Chain", "Process Planning"],
        advanced: ["Industry 4.0", "ERP Systems", "Robotics in Mfg", "TQM", "Sustainable Mfg"]
    },
    "Thermal Engineer": {
        core: ["Thermodynamics", "Heat Transfer", "Fluid Mechanics", "I.C. Engines", "Git"],
        intermediate: ["Refrigeration & AC", "Power Plant Engineering", "Turbo Machinery", "CFD", "Thermal Simulation"],
        advanced: ["Renewable Energy", "Cryogenics", "Advanced Heat Transfer", "Computational Fluid", "Energy Audit"]
    },
    "Quality Engineer": {
        core: ["Metrology", "QC Tools", "Inspection Methods", "Standards (ISO)", "Git"],
        intermediate: ["SQC", "Root Cause Analysis", "TQM", "Process Capability", "Calibration"],
        advanced: ["APQP/PPAP", "Reliability Engineering", "Quality Audit", "Zero Defect Mfg", "Data-Driven Quality"]
    },

    // Civil Roles
    "Structural Engineer": {
        core: ["Structural Analysis", "RCC Design", "Strength of Materials", "Math", "Git"],
        intermediate: ["Steel Design", "Staad Pro / ETABS", "Earthquake Eng", "Bridge Eng", "Foundation Design"],
        advanced: ["Pre-stressed Concrete", "Dynamic Analysis", "High-Rise Design", "Rehabilitation", "BIM Basics"]
    },
    "Site Engineer": {
        core: ["Surveying", "Building Drawings", "Construction Materials", "Estimation", "Git"],
        intermediate: ["Project Management", "Construction Safety", "Quantity Surveying", "Concrete Mix", "Site Supervision"],
        advanced: ["Total Station/GPS", "Pavement Design", "Smart Construction", "Project Economics", "Sustainability"]
    },
    "Environmental Engineer": {
        core: ["Hydrology", "Environmental Chemistry", "Waste Water Eng", "Air Pollution", "Git"],
        intermediate: ["Solid Waste Mgmt", "EIA", "Water Treatment Design", "Sustainable Dev", "GIS Basics"],
        advanced: ["Hazardous Waste Mgmt", "Pollution Control", "Climate Change Analysis", "Environmental Law", "Renewable Energy"]
    },
    "Project Planning Engineer": {
        core: ["Project Mgmt Basics", "MS Project", "Primavera", "Costing", "Git"],
        intermediate: ["Planning and Scheduling", "Resource Levelling", "Budgeting", "Contract Mgmt", "Risk Mgmt"],
        advanced: ["Critical Path Method", "Earned Value Mgmt", "Strategic Planning", "BIM Integration", "Advanced Project Finance"]
    },

    // EEE Roles
    "Power Systems Engineer": {
        core: ["Power Systems", "Circuit Theory", "Electrical Machines", "Smart Grids", "Git"],
        intermediate: ["Power System Analysis", "Protection & Switchgear", "High Voltage Eng", "Renewable Integration", "PSCAD/ETAP"],
        advanced: ["FACTS", "Stability Analysis", "Grid Management", "Microgrids", "Energy Market Analysis"]
    },
    "Control Systems Engineer": {
        core: ["Control Systems", "Digital Electronics", "Measurements", "Sensors", "Git"],
        intermediate: ["Adaptive Control", "Digital Control", "PLC/SCADA", "Signal Processing", "MATLAB/Simulink"],
        advanced: ["Robotic Control", "Non-linear Control", "Modern Control Theory", "Embedded Control", "Networked Control Systems"]
    },
    "Electrical Design Engineer": {
        core: ["Electrical Machines", "Power Electronics", "Design Standards", "Electrical CAD", "Git"],
        intermediate: ["Transformer Design", "Motor Design", "PCB Design", "Circuit Design", "Altium/KiCAD"],
        advanced: ["Drive Systems", "EMC/EMI Compliance", "Product Design", "Advanced Power Electronics", "Energy Storage Design"]
    },
    "Embedded Systems (Hybrid)": {
        core: ["Microcontrollers", "C Programming", "Analog Electronics", "Digital Electronics", "Git"],
        intermediate: ["RTOS Basics", "Communication Protocols", "Device Drivers", "Embedded C++", "Hardware Abstraction"],
        advanced: ["SoC Design", "Embedded Linux", "FPGA Programming", "Firmware Security", "Low Power Optimization"]
    },

    // ECE Roles
    "Embedded Systems Engineer": {
        core: ["Microprocessors", "Microcontrollers", "C/Embedded C", "Bare Metal", "Git"],
        intermediate: ["RTOS", "UART/I2C/SPI", "Peripheral Interfacing", "PCB Design", "Testing"],
        advanced: ["Linux Kernel", "SoC Design", "Device Drivers", "Safety Standards", "AI at Edge"]
    },
    "VLSI Engineer": {
        core: ["Digital System Design", "Verilog/VHDL", "VLSI Basics", "CMOS", "Git"],
        intermediate: ["FPGA Prototyping", "RTL Coding", "Physical Design", "STA", "Standard Cell Design"],
        advanced: ["ASIC Design", "DFT", "Advanced Verification (UVM)", "Layout & Routing", "Analog VLSI"]
    },
    "Communication Engineer": {
        core: ["Signals & Systems", "Analog Comm", "Digital Comm", "Antennas", "Git"],
        intermediate: ["Wireless Comm", "Optical Fiber", "Network Protocols", "DSP", "Channel Coding"],
        advanced: ["5G/6G Tech", "MIMO Systems", "Satellite Comm", "SDR", "RF System Design"]
    },
    "IoT Engineer": {
        core: ["Sensors & Data", "Arduino/ESP32", "IoT Protocols (MQTT)", "Networking", "Git"],
        intermediate: ["Gateway Design", "Cloud IoT", "Data Analytics", "LORA/BLE", "Edge Computing"],
        advanced: ["End-to-End Security", "Device Management", "Fleet Management", "Advanced Edge AI", "Industrial IoT"]
    },

    // Mechatronics Roles
    "Robotics Engineer": {
        core: ["Engineering Mechanics", "Robotics Basics", "Control Systems", "Sensors", "Git"],
        intermediate: ["Kinematics & Dynamics", "Robot Programming", "Computer Vision", "ROS", "Path Planning"],
        advanced: ["Autonomous Systems", "Advanced AI/ML", "Human-Robot Interaction", "Biomedical Robotics", "Collaborative Robots"]
    },
    "Automation Engineer": {
        core: ["Sensors & Actuators", "Electrical Systems", "PLC Programming", "Control Systems", "Git"],
        intermediate: ["SCADA/HMI", "Pneumatics & Hydraulics", "Process Control", "DCS", "Industrial Networking"],
        advanced: ["Industry 4.0", "Advanced PLC", "Cyber-Physical Systems", "Smart Factory Design", "AI in Automation"]
    },
    "Industrial IoT Engineer": {
        core: ["Sensors", "Embedded Basics", "Industrial Proto (MODBUS)", "Measurements", "Git"],
        intermediate: ["Edge Gateways", "Predictive Maintenance", "Cloud Integration", "Data Security", "Dashboarding"],
        advanced: ["Digital Twin", "Cybersecurity (OT)", "Smart Sensing", "Large Scale Deployment", "Zero-Touch Provisioning"]
    },

    // Others
    "IT Transition Track": {
        core: ["Programming Logic", "Core Language (Java/Python)", "HTML/CSS Basics", "Git", "Problem Solving"],
        intermediate: ["DBMS/SQL", "Web Dev Basics", "Data Structures", "API Basics", "SDLC"],
        advanced: ["Cloud Fundamentals", "System Analysis", "Full Stack Basics", "Agile", "Tech Interview Prep"]
    },
    "Generalist": {
        core: ["Aptitude", "Communication", "Basic Tech Skills", "Documentation", "Git"],
        intermediate: ["Project Coordination", "Presentation Skills", "Interpersonal Skills", "Critical Thinking", "Team Management"],
        advanced: ["Leadership", "Stakeholder Management", "Problem Solving", "Strategic Planning", "Execution Excellence"]
    }
};

// ── Department → Roles Mapping ──
export const DEPARTMENT_ROLES: Record<string, PlacementRole[]> = {
    // IT / CSE departments
    "CSE": ["Frontend Developer", "Backend Developer", "Full Stack Developer", "Java Developer", "Python Developer", "AI/ML Engineer", "DevOps Engineer", "Generalist"],
    "IT": ["Frontend Developer", "Backend Developer", "Full Stack Developer", "Java Developer", "Python Developer", "AI/ML Engineer", "DevOps Engineer", "Generalist"],
    "AIML": ["AI/ML Engineer", "Python Developer", "Full Stack Developer", "Backend Developer", "DevOps Engineer", "Generalist"],
    "AI & DS": ["AI/ML Engineer", "Python Developer", "Full Stack Developer", "Backend Developer", "DevOps Engineer", "Generalist"],
    "Cyber Security": ["Backend Developer", "DevOps Engineer", "Full Stack Developer", "Python Developer", "Generalist"],
    "Software Engineering": ["Frontend Developer", "Backend Developer", "Full Stack Developer", "Java Developer", "Python Developer", "DevOps Engineer", "Generalist"],

    // Mechanical
    "Mechanical": ["Design Engineer", "Production Engineer", "Thermal Engineer", "Quality Engineer", "IT Transition Track", "Generalist"],
    "Automobile": ["Design Engineer", "Production Engineer", "Thermal Engineer", "Quality Engineer", "IT Transition Track", "Generalist"],
    "Production": ["Production Engineer", "Quality Engineer", "Design Engineer", "IT Transition Track", "Generalist"],

    // Civil
    "Civil": ["Structural Engineer", "Site Engineer", "Environmental Engineer", "Project Planning Engineer", "IT Transition Track", "Generalist"],

    // EEE
    "EEE": ["Power Systems Engineer", "Control Systems Engineer", "Electrical Design Engineer", "Embedded Systems (Hybrid)", "IT Transition Track", "Generalist"],

    // ECE
    "ECE": ["Embedded Systems Engineer", "VLSI Engineer", "Communication Engineer", "IoT Engineer", "IT Transition Track", "Generalist"],

    // Mechatronics
    "Mechatronics": ["Robotics Engineer", "Automation Engineer", "Industrial IoT Engineer", "IT Transition Track", "Generalist"],

    // Chemical (fallback)
    "Chemical": ["Quality Engineer", "Production Engineer", "IT Transition Track", "Generalist"]
};

/**
 * Get the list of placement roles relevant to a given department.
 * Falls back to all roles if department is unknown.
 */
export function getRolesForDepartment(dept: string): PlacementRole[] {
    if (DEPARTMENT_ROLES[dept]) return DEPARTMENT_ROLES[dept];
    // Fallback: return all roles
    return [...PLACEMENT_ROLES];
}
