function makeCourse(id, subject, stream, grade, bookTitle, chapters) {
  let unitIndex = 0;
  const units = chapters.flatMap((chapterLine, chapterIndex) => {
    const [chapter, topicList] = chapterLine.split("::");
    return topicList.split(";").map((title) => ({
      id: `${id}-${String(++unitIndex).padStart(3, "0")}`,
      chapter: chapter.trim(),
      chapterNumber: chapterIndex + 1,
      title: title.trim(),
    }));
  });

  return {
    id,
    subject,
    stream,
    streams: subject === "Physics" || subject === "Chemistry"
      ? ["PCM", "PCB"]
      : subject === "Economics"
        ? ["Commerce", "Humanities"]
        : [stream],
    grade,
    bookTitle,
    units,
  };
}

export const courses = [
  makeCourse("physics-11", "Physics", "PCM", "XI", "Physics Part I & II", [
    "Measurements and motion::Units, dimensions and measurement errors; Position, displacement, and reference frames; Speed, velocity, and acceleration; Motion graphs and equations",
    "Motion in a plane::Scalars and vectors; Vector components and resolution; Projectile motion; Uniform circular motion",
    "Laws of motion::Newton's laws of motion; Free-body diagrams; Friction and circular motion; Momentum, impulse, and collisions",
    "Work, energy and power::Work by constant and variable forces; Kinetic and potential energy; Conservation of mechanical energy; Power and collisions",
    "System of particles and rotation::Centre of mass; Torque and angular momentum; Rotational kinematics; Moment of inertia and rolling",
    "Gravitation::Newton's law of gravitation; Gravitational field and potential; Satellites and orbital motion; Escape speed and Kepler's laws",
    "Properties of bulk matter::Elasticity and stress; Fluid pressure and buoyancy; Viscosity and surface tension; Heat, expansion, and calorimetry",
    "Thermodynamics::Thermal equilibrium and zeroth law; First law and internal energy; Heat engines and the second law; Reversible and irreversible processes",
    "Kinetic theory::Molecular model of gases; Pressure, temperature, and molecular speeds; Degrees of freedom and equipartition; Specific heat of gases",
    "Oscillations and waves::Simple harmonic motion; Pendulums and energy in oscillations; Wave motion and superposition; Sound, resonance, and standing waves",
  ]),
  makeCourse("physics-12", "Physics", "PCM", "XII", "Physics Part I & II", [
    "Electrostatics::Electric charge and Coulomb's law; Electric field and field lines; Electric flux and Gauss's law; Electric potential and potential energy; Capacitors and dielectrics",
    "Current electricity::Electric current and drift velocity; Resistance, resistivity, and Ohm's law; Series and parallel circuits; Kirchhoff's rules and bridges",
    "Magnetism and moving charges::Magnetic force on charges and currents; Motion of charged particles in magnetic fields; Biot–Savart and Ampere's laws; Magnetic materials and Earth's field",
    "Electromagnetic induction and AC::Magnetic flux and Faraday's law; Lenz's law and eddy currents; Self and mutual inductance; Alternating current, reactance, and resonance; Transformers",
    "Electromagnetic waves::Displacement current; Electromagnetic spectrum; Properties and applications of each band",
    "Optics::Reflection and refraction; Mirrors, lenses, and optical instruments; Huygens' principle and wave optics; Interference, diffraction, and polarization",
    "Dual nature of radiation and matter::Photoelectric effect and Einstein's equation; Matter waves and de Broglie wavelength; Electron diffraction",
    "Atoms and nuclei::Rutherford and Bohr atomic models; Energy levels and spectra; Nuclear size and binding energy; Radioactive decay and nuclear reactions",
    "Semiconductor electronics::Energy bands and semiconductors; Diodes and rectifiers; Transistors as switches; Logic gates and digital circuits",
  ]),
  makeCourse("chemistry-11", "Chemistry", "PCM", "XI", "Chemistry Part I & II", [
    "Some basic concepts of chemistry::Laws of chemical combination; Mole concept and molar mass; Stoichiometry and limiting reagents; Concentration of solutions",
    "Structure of atom::Electromagnetic radiation and spectra; Bohr model and hydrogen spectrum; Quantum numbers and orbitals; Electronic configuration",
    "Classification of elements and periodicity::Modern periodic law; Electronic configuration and periodic table; Trends in atomic radius, ionization energy, and electron affinity",
    "Chemical bonding and molecular structure::Lewis structures and octet rule; Ionic and covalent bonding; VSEPR shapes and hybridisation; Molecular orbital theory; Hydrogen bonding",
    "Chemical thermodynamics::System, surroundings, and state functions; Enthalpy and calorimetry; Hess's law and formation enthalpies; Entropy, spontaneity, and Gibbs energy",
    "Equilibrium::Dynamic equilibrium and equilibrium constants; Le Chatelier's principle; Acids, bases, and pH; Buffer solutions and solubility product",
    "Redox reactions::Oxidation numbers and redox identification; Balancing redox reactions; Applications of redox in cells",
    "Organic chemistry basics::Nomenclature and functional groups; Structural and stereoisomerism; Inductive, resonance, and hyperconjugation effects; Organic reaction mechanisms and purification",
    "Hydrocarbons::Alkanes and conformations; Alkenes and addition reactions; Alkynes and acidity; Aromaticity and electrophilic substitution",
  ]),
  makeCourse("chemistry-12", "Chemistry", "PCM", "XII", "Chemistry Part I & II", [
    "Solutions::Concentration and solubility; Raoult's law and vapour pressure; Ideal and non-ideal solutions; Colligative properties and osmotic pressure",
    "Electrochemistry::Galvanic and electrolytic cells; Standard electrode potentials; Nernst equation; Conductivity and Kohlrausch's law; Batteries and corrosion",
    "Chemical kinetics::Rate laws and reaction order; Integrated rate equations; Half-life and pseudo-first-order reactions; Activation energy and Arrhenius equation",
    "The d- and f-block elements::Electronic configuration and oxidation states; Trends and properties of transition elements; Coordination compounds overview; Lanthanoids and actinoids",
    "Coordination compounds::Ligands and coordination number; IUPAC nomenclature and isomerism; Valence bond and crystal field ideas; Bonding, colour, and applications",
    "Haloalkanes and haloarenes::Nomenclature and carbon–halogen bond; Nucleophilic substitution mechanisms; Elimination and competing reactions; Haloarene reactivity",
    "Alcohols, phenols and ethers::Nomenclature and preparation; Acidity and physical properties; Reactions of alcohols and phenols; Ether cleavage and uses",
    "Aldehydes, ketones and carboxylic acids::Carbonyl structure and nucleophilic addition; Aldehyde and ketone reactions; Carboxylic-acid acidity and derivatives; Distinguishing tests",
    "Amines::Classification and nomenclature; Basicity and preparation; Reactions of primary, secondary, and tertiary amines; Diazonium salts",
    "Biomolecules::Carbohydrates and glycosidic bonds; Amino acids, proteins, and enzymes; DNA, RNA, and nucleic acids; Vitamins and hormones",
  ]),
  makeCourse("maths-11", "Mathematics", "PCM", "XI", "Mathematics Part I & II", [
    "Sets and relations::Sets, subsets, and set operations; Venn diagrams and De Morgan's laws; Relations and equivalence; Functions and domain and range",
    "Trigonometry::Degree and radian measure; Trigonometric identities; Trigonometric equations; Sine and cosine rules",
    "Algebra::Complex numbers and Argand plane; Quadratic equations and inequalities; Permutations and combinations; Binomial theorem; Sequences, series, and arithmetic and geometric progressions",
    "Coordinate geometry::Cartesian coordinates and distance; Straight lines and slope; Conic sections: circle, parabola, ellipse, hyperbola; Three-dimensional coordinates",
    "Calculus::Limits and continuity; Derivatives from first principles; Derivative rules and rates of change; Chain rule and implicit differentiation",
    "Statistics and probability::Measures of dispersion and standard deviation; Random experiments and sample spaces; Conditional probability and Bayes' theorem; Random variables",
  ]),
  makeCourse("maths-12", "Mathematics", "PCM", "XII", "Mathematics Part I & II", [
    "Relations and functions::Types of relations and equivalence; One-one and onto functions; Composition and inverse of functions; Inverse trigonometric functions",
    "Matrices and determinants::Types and operations on matrices; Transpose and inverse of a matrix; Determinants and their properties; Solving linear equations by matrix methods",
    "Calculus::Continuity and differentiability; Chain rule, implicit differentiation, and derivatives; Applications of derivatives and optimization; Indefinite and definite integrals; Fundamental theorem of calculus; Differential equations and applications",
    "Vectors and three-dimensional geometry::Vectors and scalar and vector products; Lines and planes in space; Angles and distances in three dimensions",
    "Linear programming::Constraints and feasible regions; Graphical solution and optimization",
    "Probability::Conditional probability and multiplication rule; Independent events and Bayes' theorem; Probability distributions and expected value",
  ]),
  makeCourse("biology-11", "Biology", "PCB", "XI", "Biology", [
    "Diversity of living organisms::Characteristics and classification of living things; The five-kingdom system; Plant classification and life cycles; Animal classification and body plans",
    "Structural organisation::Plant tissues and anatomy; Root, stem, and leaf structure; Animal tissues; Frog and cockroach organisation",
    "Cell structure and function::Cell theory and prokaryotic cells; Eukaryotic organelles; Cell membrane and transport; Biomolecules and enzymes; Mitosis and meiosis",
    "Plant physiology::Water transport and transpiration; Mineral nutrition; Photosynthesis and light reactions; Cellular respiration; Plant growth regulators and development",
    "Human physiology::Digestion and absorption; Breathing and gas exchange; Circulation, blood, and lymph; Excretion and osmoregulation; Locomotion and muscle contraction; Neural control and coordination; Endocrine glands and hormones",
  ]),
  makeCourse("biology-12", "Biology", "PCB", "XII", "Biology", [
    "Reproduction::Asexual reproduction and reproductive health; Flower structure and pollination; Double fertilisation and seed development; Human reproductive systems; Gametogenesis, menstrual cycle, and fertilisation",
    "Genetics and evolution::Mendelian inheritance and test crosses; Incomplete dominance, codominance, and linkage; DNA, RNA, and genetic code; Replication, transcription, and translation; Mutations and molecular basis of disease; Natural selection, speciation, and evolution",
    "Biology and human welfare::Human health, immunity, and common diseases; Food production and animal husbandry; Microbes in industry, food, and health",
    "Biotechnology::Recombinant DNA technology and vectors; PCR, gel electrophoresis, and cloning; Applications in medicine and agriculture",
    "Ecology and environment::Populations and ecological interactions; Ecosystems, energy flow, and succession; Biodiversity and conservation; Pollution, climate change, and environmental issues",
  ]),
  makeCourse("accountancy-11", "Accountancy", "Commerce", "XI", "Accountancy", [
    "Introduction to accounting::Purpose and role of accounting; Accounting concepts and conventions; Accounting equation and the dual aspect",
    "Accounting process::Source documents and vouchers; Journal entries and ledger posting; Trial balance and correction of errors; Cash book and subsidiary books",
    "Financial statements::Capital and revenue expenditure; Depreciation and provisions; Trading, profit and loss account; Balance sheet and adjustments; Bank reconciliation; Bills of exchange",
    "Computerised accounting::Accounting information systems; Spreadsheets and digital financial records; Accounting software and data integrity",
  ]),
  makeCourse("accountancy-12", "Accountancy", "Commerce", "XII", "Accountancy", [
    "Accounting for partnerships::Partnership fundamentals and profit sharing; Admission of a partner and goodwill; Retirement or death of a partner; Dissolution of a partnership",
    "Company accounts::Issue of shares and forfeiture; Issue and redemption of debentures; Financial statements of companies; Analysis of financial statements",
    "Cash flow and ratios::Objectives and preparation of a cash-flow statement; Liquidity, solvency, activity, and profitability ratios; Interpreting financial performance",
  ]),
  makeCourse("business-11", "Business Studies", "Commerce", "XI", "Business Studies", [
    "Foundations of business::Nature and purpose of business; Forms of business organisation; Public, private, and global enterprises",
    "Services and commerce::Business services and banking; Insurance principles; E-business and digital services; Social responsibilities and business ethics",
    "Business finance and trade::Sources of business finance; Small business and entrepreneurship; Domestic trade and retail; International business and documentation",
  ]),
  makeCourse("business-12", "Business Studies", "Commerce", "XII", "Business Studies", [
    "Principles and management::Nature and significance of management; Principles of management; Business environment",
    "Planning and organising::Planning process and limitations; Organisational structure and delegation",
    "Staffing, directing and control::Recruitment, selection, and training; Motivation, leadership, and communication; Controlling process and techniques",
    "Business finance and marketing::Financial management and capital structure; Working capital and financial markets; Marketing management and the marketing mix; Consumer protection and rights",
  ]),
  makeCourse("economics-11", "Economics", "Commerce", "XI", "Economics", [
    "Statistics for economics::Collection, organisation, and presentation of data; Measures of central tendency; Measures of dispersion and correlation; Index numbers and interpreting data",
    "Introductory microeconomics::Scarcity and the central problems of an economy; Consumer behaviour, utility, and demand; Elasticity of demand; Production, cost, and supply; Market equilibrium and price determination",
  ]),
  makeCourse("economics-12", "Economics", "Commerce", "XII", "Economics", [
    "Macroeconomics::National income aggregates and measurement; Money, banking, and credit creation; Determination of income, output, and employment; Government budget and fiscal policy; Balance of payments and exchange rates",
    "Indian economic development::Indian economy on the eve of independence; Planning and development experience; Economic reforms since 1991; Human capital and rural development; Employment, infrastructure, and the environment; India compared with neighbouring economies",
  ]),
  makeCourse("history-11", "History", "Humanities", "XI", "Themes in World History", [
    "Early societies and cultures::From the beginning of time; Writing and city life; An empire across three continents",
    "Interconnected worlds::The Central Islamic lands; Nomadic empires; The three orders",
    "Early modern and modern societies::Changing cultural traditions; Confrontation of cultures; The Industrial Revolution; Displacing indigenous peoples; Paths to modernisation",
  ]),
  makeCourse("history-12", "History", "Humanities", "XII", "Themes in Indian History", [
    "Ancient Indian history::Bricks, beads, and bones: the Harappan Civilisation; Kings, farmers, and towns: early states and economies; Kinship, caste, and class; Thinkers, beliefs, and buildings",
    "Medieval Indian history::Through the eyes of travellers; Bhakti-Sufi traditions; An imperial capital: Vijayanagara; Peasants, zamindars, and the state; Kings and chronicles: the Mughal courts",
    "Modern Indian history::Colonialism and the countryside; Rebels and the Raj; Mahatma Gandhi and the national movement; Framing the Constitution",
  ]),
  makeCourse("geography-11", "Geography", "Humanities", "XI", "Fundamentals of Physical Geography", [
    "Earth and its interior::Origin and evolution of the Earth; Interior of the Earth and seismic waves; Continental drift and plate tectonics",
    "Landforms and processes::Minerals and rocks; Geomorphic processes and mass movement; Landforms created by rivers, glaciers, wind, and groundwater",
    "Climate and water::Atmosphere and solar radiation; Temperature, pressure, and winds; Humidity, clouds, and precipitation; World climate and climate change; Oceans, circulation, waves, and tides",
    "Life on Earth::Soils and soil formation; Natural vegetation, biomes, and biodiversity",
  ]),
  makeCourse("geography-12", "Geography", "Humanities", "XII", "India: People and Economy", [
    "Human geography fundamentals::Human geography and its branches; World population distribution and growth; Human development; Primary and secondary activities; Tertiary, quaternary, and quinary activities; Transport, communication, and international trade",
    "India: people and economy::Population distribution, density, and change; Migration and human settlements; Land and water resources; Agriculture, minerals, and energy; Manufacturing industries; Planning, transport, and communication; Geographical perspectives on selected environmental issues",
  ]),
  makeCourse("political-science-11", "Political Science", "Humanities", "XI", "Political Theory and Indian Constitution at Work", [
    "Constitution and government::Constitution and its need; Rights in the Indian Constitution; Election and representation; Executive; Legislature; Judiciary; Federalism; Local governments",
    "Political theory::Political theory and freedom; Equality and social justice; Rights and citizenship; Nationalism and secularism; Peace and development",
  ]),
  makeCourse("political-science-12", "Political Science", "Humanities", "XII", "Politics in India Since Independence", [
    "Contemporary world politics::The end of bipolarity; Contemporary centres of power; South Asia and international organisations; Security and the environment; Globalisation",
    "Politics in India since independence::Challenges of nation-building; One-party dominance and planned development; India's foreign relations; Challenges to and restoration of the Congress system; Crisis of the democratic order; Regional aspirations and the rise of popular movements; Recent developments in Indian politics",
  ]),
  makeCourse("sociology-11", "Sociology", "Humanities", "XI", "Introducing Sociology", [
    "Sociological foundations::Sociology and society; Terms, concepts, and their use in sociology; Understanding social institutions; Culture and socialisation; Research methods and society",
    "Social structure and change::Social structure, stratification, and inequality; Social change and social order in rural and urban society; Environment and society; Western and Indian sociologists",
  ]),
  makeCourse("sociology-12", "Sociology", "Humanities", "XII", "Indian Society", [
    "Structure and diversity of Indian society::Demographic structure and change; Social institutions and their transformations; Patterns of social inequality and exclusion; The challenges of cultural diversity",
    "Social change and development in India::Structural change and cultural change; The story of Indian democracy; Change and development in rural and urban society; Globalisation and social change; Mass media and communications; Social movements",
  ]),
  makeCourse("psychology-11", "Psychology", "Humanities", "XI", "Psychology", [
    "Foundations of psychology::What is psychology; Methods of enquiry in psychology; The bases of human behaviour; Human development",
    "Human processes::Sensory, attentional, and perceptual processes; Learning; Human memory; Thinking; Motivation and emotion",
  ]),
  makeCourse("psychology-12", "Psychology", "Humanities", "XII", "Psychology", [
    "Individual differences and self::Variations in psychological attributes; Self and personality",
    "Cognition, health, and wellbeing::Meeting life challenges; Psychological disorders; Therapeutic approaches; Attitude and social cognition; Social influence and group processes",
    "Applied psychology::Psychology and life; Developing psychological skills",
  ]),
];

export const publicTextbooks = [
  ["physics-ncert", "Physics Part I & II", "Physics", "PCM", "XI"],
  ["ncert-physics-12", "Physics Part I & II", "Physics", "PCM", "XII"],
  ["ncert-chemistry-11", "Chemistry Part I & II", "Chemistry", "PCM", "XI"],
  ["chemistry-ncert", "Chemistry Part I & II", "Chemistry", "PCM", "XII"],
  ["maths-ncert", "Mathematics Part I & II", "Mathematics", "PCM", "XI"],
  ["ncert-mathematics-12", "Mathematics Part I & II", "Mathematics", "PCM", "XII"],
  ["ncert-biology-11", "Biology", "Biology", "PCB", "XI"],
  ["biology-ncert", "Biology", "Biology", "PCB", "XII"],
  ["ncert-accountancy-11", "Accountancy", "Accountancy", "Commerce", "XI"],
  ["ncert-accountancy-12", "Accountancy", "Accountancy", "Commerce", "XII"],
  ["ncert-business-studies-11", "Business Studies", "Business Studies", "Commerce", "XI"],
  ["ncert-business-studies-12", "Business Studies", "Business Studies", "Commerce", "XII"],
  ["ncert-economics-11", "Statistics for Economics & Introductory Microeconomics", "Economics", "Commerce", "XI"],
  ["ncert-economics-12", "Introductory Macroeconomics & Indian Economic Development", "Economics", "Commerce", "XII"],
  ["ncert-humanities-economics-11", "Statistics for Economics & Introductory Microeconomics", "Economics", "Humanities", "XI"],
  ["ncert-humanities-economics-12", "Introductory Macroeconomics & Indian Economic Development", "Economics", "Humanities", "XII"],
  ["ncert-history-11", "Themes in World History", "History", "Humanities", "XI"],
  ["ncert-history-12", "Themes in Indian History Part I–III", "History", "Humanities", "XII"],
  ["ncert-geography-11", "Fundamentals of Physical Geography", "Geography", "Humanities", "XI"],
  ["ncert-geography-12", "India: People and Economy", "Geography", "Humanities", "XII"],
  ["ncert-political-science-11", "Indian Constitution at Work & Political Theory", "Political Science", "Humanities", "XI"],
  ["ncert-political-science-12", "Politics in India Since Independence & Contemporary World Politics", "Political Science", "Humanities", "XII"],
  ["ncert-sociology-11", "Introducing Sociology", "Sociology", "Humanities", "XI"],
  ["ncert-sociology-12", "Indian Society & Social Change and Development in India", "Sociology", "Humanities", "XII"],
  ["ncert-psychology-11", "Psychology", "Psychology", "Humanities", "XI"],
  ["ncert-psychology-12", "Psychology", "Psychology", "Humanities", "XII"],
].map(([id, title, subject, track, grade], index) => ({
  id,
  title,
  author: "NCERT",
  publisher: "National Council of Educational Research and Training",
  subject,
  track,
  level: `Class ${grade}`,
  description: `Official NCERT textbook for ${subject}, Class ${grade}. Select the title to read online or download the PDF.`,
  source: "Read or download at NCERT",
  href: "https://ncert.nic.in/textbook.php",
  cover: subject.toUpperCase(),
  number: String(index + 17).padStart(2, "0"),
  color: ["mint", "lilac", "peach", "blue"][index % 4],
  type: "official",
}));

export const textbookCaution =
  "Topic checklists are a study guide based on standard NCERT course material—not an exam guarantee. Compare each year’s CBSE curriculum and rationalised textbook chapters with the official CBSE and NCERT websites.";
