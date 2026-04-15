export const CORE_ACADEMIC_TOPICS = {
    // --- IT / CSE ---
    "Data Structures": [
        "Arrays & Strings", "Linked Lists", "Stacks & Queues", "Trees & BST",
        "Graphs (BFS/DFS)", "Hashing", "Heaps", "Recursion"
    ],
    "Algorithms": [
        "Sorting & Searching", "Dynamic Programming", "Greedy Algorithms",
        "Divide & Conquer", "Complexity Analysis", "Backtracking"
    ],
    "DBMS": [
        "ER Modeling", "Normalization", "SQL (DDL/DML)", "Joins",
        "Transactions (ACID)", "Indexing", "NoSQL Basics"
    ],
    "Operating Systems": [
        "Process Management", "CPU Scheduling", "Deadlocks", "Memory Management",
        "Virtual Memory", "File Systems", "Shell Scripting"
    ],
    "Computer Networks": [
        "OSI & TCP/IP Models", "IP Addressing", "Routing Protocols",
        "TCP/UDP", "HTTP/DNS", "Network Security"
    ],
    "OOPS": [
        "Classes & Objects", "Inheritance", "Polymorphism", "Encapsulation",
        "Abstraction", "Interfaces", "Exception Handling"
    ],
    "Problem Solving": [
        "Algorithm Design", "Pattern Recognition", "Logic Building",
        "Debugging", "Code Optimization"
    ],

    // --- Mechanical ---
    "Engineering Mechanics": [
        "Statics of Particles", "Equilibrium of Rigid Bodies", "Friction",
        "Centroid & Moment of Inertia", "Dynamics"
    ],
    "Thermodynamics": [
        "Laws of Thermodynamics", "Properties of Pure Substances",
        "Ideal & Real Gases", "Psychrometry", "Thermodynamic Cycles"
    ],
    "Fluid Mechanics": [
        "Fluid Properties", "Fluid Statics", "Fluid Kinematics",
        "Bernoulli's Equation", "Flow through Pipes"
    ],
    "Strength of Materials": [
        "Stress & Strain", "Bending Moment & Shear Force", "Torsion",
        "Deflection of Beams", "Columns & Struts"
    ],
    "Manufacturing Technology": [
        "Casting", "Welding", "Metal Forming", "Machining",
        "Metrology & Inspection"
    ],
    "Machine Design": [
        "Design of Shafts", "Fasteners", "Couplings", "Design for Static Loads",
        "Design for Fluctuating Loads"
    ],
    "CAD Basics": [
        "Geometric Modeling", "2D Drafting", "3D Part Modeling",
        "Assembly Design", "Drafting Standards"
    ],

    // --- Civil ---
    "Structural Analysis": [
        "Truss Analysis", "Arches & Cables", "Displacement Method",
        "Force Method", "Matrix Method"
    ],
    "RCC": [
        "Design Philosophies", "Flexure & Shear", "Columns & Footings",
        "Slabs", "Bond & Anchorage"
    ],
    "Geotechnical Engineering": [
        "Soil Classification", "Permeability", "Compaction",
        "Foundation Engineering", "Earth Pressure"
    ],
    "Environmental Engineering": [
        "Water Quality", "Waste Water Treatment", "Air Pollution",
        "Solid Waste Management", "Environmental Impact"
    ],
    "Transportation Engineering": [
        "Highway Planning", "Geometric Design", "Pavement Design",
        "Traffic Engineering", "Railway Basics"
    ],
    "Surveying": [
        "Levelling", "Theodolite", "Traversing", "Contouring",
        "GPS & GIS Basics"
    ],

    // --- EEE ---
    "Circuit Theory": [
        "Network Theorems", "AC Circuit Analysis", "Resonance",
        "Transient Response", "Three Phase Circuits"
    ],
    "Electrical Machines": [
        "DC Machines", "Transformers", "Induction Motors",
        "Synchronous Machines", "Special Machines"
    ],
    "Power Systems": [
        "Generation & Transmission", "Load Flow Analysis", "Fault Analysis",
        "Stability", "Protection"
    ],
    "Power Electronics": [
        "Power Semiconductor Devices", "Converters", "Inverters",
        "Choppers", "AC Voltage Controllers"
    ],
    "Control Systems": [
        "Transfer Functions", "Time Response Analysis", "Stability (R-H/Nyquist)",
        "Root Locus", "Frequency Domain Analysis"
    ],
    "Measurements": [
        "Bridges", "Transducers", "Oscilloscopes", "Electronic Instruments",
        "Digital Meters"
    ],

    // --- ECE ---
    "Analog Electronics": [
        "Diode Circuits", "BJT/FET Analysis", "Op-Amps", "Feedback Amplifiers",
        "Oscillators"
    ],
    "Digital Electronics": [
        "Number Systems", "Logic Gates", "Combinational Circuits",
        "Sequential Circuits", "Memory Devices"
    ],
    "Signals & Systems": [
        "CT & DT Signals", "LTI Systems", "Fourier Transform",
        "Z-Transform", "Laplace Transform"
    ],
    "Communication Systems": [
        "Amplitude Modulation", "Angle Modulation", "Digital Modulation",
        "Probability & Noise", "Information Theory"
    ],
    "Microprocessors": [
        "8085 Architecture", "Instruction Sets", "Interfacing",
        "8051 Microcontroller", "Assembly Language"
    ],
    "VLSI Basics": [
        "MOS Transistor", "CMOS Inverter", "Layout Design",
        "VHDL/Verilog", "Fabrication Basics"
    ],

    // --- Mechatronics ---
    "Electrical Systems": [
        "Basic Circuits", "DC/AC Drives", "Relays & Contactors",
        "Electrical Wiring", "Power Supplies"
    ],
    "Sensors & Actuators": [
        "Proximity Sensors", "Encoders", "Solenoid Valves",
        "Stepper/Servo Motors", "Piezoelectric Devices"
    ],
    "Robotics Basics": [
        "Robot Kinematics", "Degree of Freedom", "End Effectors",
        "Robot Programming", "Vision Systems"
    ],
    "PLC Programming": [
        "Ladder Logic", "Timers & Counters", "Arithmetic Operations",
        "HMI Interfacing", "Networking PLCs"
    ],
    "Embedded Systems Basics": [
        "Arduino/AVR", "GPIO Programming", "Timers/PWM",
        "I2C/SPI", "Interrupt Handling"
    ],

    // --- Universal ---
    "Engineering Mathematics": [
        "Linear Algebra", "Calculus", "Differential Equations",
        "Probability & Statistics", "Numerical Methods"
    ],
    "Communication": [
        "Verbal Communication", "Written Communication", "Presentation Skills",
        "Email Etiquette", "Group Discussion", "Interview Skills", "Body Language"
    ],
    "Aptitude": [
        "Numbers & Ages", "Profit & Loss", "Time & Work", "Time, Speed & Distance",
        "Permutation & Combination", "Probability", "Percentages", "Ratios",
        "Data Interpretation", "Logical Reasoning", "Syllogism", "Coding-Decoding"
    ]
} as const;

export type CoreDomain = keyof typeof CORE_ACADEMIC_TOPICS;

