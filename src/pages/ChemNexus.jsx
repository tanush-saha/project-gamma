import React, { useState } from "react";
import { soundEngine } from "../utils/audio.js";
import { HoloTiltCard } from "../components/HoloTiltCard.jsx";

// Core elements dataset with electronic configuration, oxidation states, flame test colors and high-yield notes
const ELEMENTS_DATA = [
  { z: 1, sym: "H", name: "Hydrogen", mass: "1.008", block: "s", category: "Reactive nonmetal", period: 1, group: 1, config: "1s¹", ox: "+1, -1", flame: "Pale Blue", flameHex: "#a0c4ff", yield: "Unique position; behaves like alkali metals and halogens; high ionization enthalpy." },
  { z: 2, sym: "He", name: "Helium", mass: "4.003", block: "p", category: "Noble gas", period: 1, group: 18, config: "1s²", ox: "0", flame: "None", flameHex: "#f0f0f0", yield: "Highest ionization energy in periodic table; completely filled duplet." },
  { z: 3, sym: "Li", name: "Lithium", mass: "6.94", block: "s", category: "Alkali metal", period: 2, group: 1, config: "[He] 2s¹", ox: "+1", flame: "Crimson Red", flameHex: "#e60039", yield: "Highest hydration enthalpy among alkali metals; anomalous diagonal relationship with Mg." },
  { z: 4, sym: "Be", name: "Beryllium", mass: "9.012", block: "s", category: "Alkaline earth metal", period: 2, group: 2, config: "[He] 2s²", ox: "+2", flame: "None", flameHex: "#e2e8f0", yield: "Amphoteric oxide (BeO); covalent character due to high charge-to-radius ratio; diagonal relationship with Al." },
  { z: 5, sym: "B", name: "Boron", mass: "10.81", block: "p", category: "Metalloid", period: 2, group: 13, config: "[He] 2s² 2p¹", ox: "+3", flame: "Bright Green", flameHex: "#00f5d4", yield: "Forms electron-deficient diborane (B₂H₆) with 3-center 2-electron banana bonds." },
  { z: 6, sym: "C", name: "Carbon", mass: "12.011", block: "p", category: "Reactive nonmetal", period: 2, group: 14, config: "[He] 2s² 2p²", ox: "+4, +2, -4", flame: "None", flameHex: "#333333", yield: "Maximum catenation ability due to high C-C bond energy (348 kJ/mol); allotropes: diamond, graphite, fullerenes." },
  { z: 7, sym: "N", name: "Nitrogen", mass: "14.007", block: "p", category: "Reactive nonmetal", period: 2, group: 15, config: "[He] 2s² 2p³", ox: "-3 to +5", flame: "None", flameHex: "#4361ee", yield: "Triple bond (N≡N) makes it chemically inert at room temp; cannot expand octet due to absence of d-orbitals." },
  { z: 8, sym: "O", name: "Oxygen", mass: "15.999", block: "p", category: "Reactive nonmetal", period: 2, group: 16, config: "[He] 2s² 2p⁴", ox: "-2, -1, +2 (OF₂)", flame: "None", flameHex: "#06d6a0", yield: "Paramagnetic nature of O₂ explained by Molecular Orbital Theory (2 unpaired electrons in π*2p)." },
  { z: 9, sym: "F", name: "Fluorine", mass: "18.998", block: "p", category: "Halogen", period: 2, group: 17, config: "[He] 2s² 2p⁵", ox: "-1", flame: "None", flameHex: "#ffbe0b", yield: "Most electronegative element (4.0 on Pauling scale); strongest oxidizing agent; low F-F bond dissociation energy due to lone pair repulsion." },
  { z: 10, sym: "Ne", name: "Neon", mass: "20.180", block: "p", category: "Noble gas", period: 2, group: 18, config: "[He] 2s² 2p⁶", ox: "0", flame: "Orange-Red glow", flameHex: "#ff5400", yield: "Used in beacon lights and advertising displays; stable octet." },
  { z: 11, sym: "Na", name: "Sodium", mass: "22.990", block: "s", category: "Alkali metal", period: 3, group: 1, config: "[Ne] 3s¹", ox: "+1", flame: "Golden Yellow", flameHex: "#ffb703", yield: "Kept in kerosene; imparts characteristic intense golden yellow flame; liquid Na is coolant in nuclear reactors." },
  { z: 12, sym: "Mg", name: "Magnesium", mass: "24.305", block: "s", category: "Alkaline earth metal", period: 3, group: 2, config: "[Ne] 3s²", ox: "+2", flame: "Dazzling White", flameHex: "#ffffff", yield: "Forms Grignard reagents (RMgX) essential in organic synthesis; present in chlorophyll pigment." },
  { z: 13, sym: "Al", name: "Aluminium", mass: "26.982", block: "p", category: "Post-transition metal", period: 3, group: 13, config: "[Ne] 3s² 3p¹", ox: "+3", flame: "Silver White", flameHex: "#e0e1dd", yield: "Amphoteric oxide (Al₂O₃) and hydroxide; extracted via Hall-Héroult electrolytic process." },
  { z: 14, sym: "Si", name: "Silicon", mass: "28.085", block: "p", category: "Metalloid", period: 3, group: 14, config: "[Ne] 3s² 3p²", ox: "+4, -4", flame: "None", flameHex: "#778da9", yield: "Basis of silicones and silicates (ortho, pyro, chain, sheet, 3D framework); second most abundant element in Earth's crust." },
  { z: 15, sym: "P", name: "Phosphorus", mass: "30.974", block: "p", category: "Reactive nonmetal", period: 3, group: 15, config: "[Ne] 3s² 3p³", ox: "-3, +3, +5", flame: "Pale Greenish", flameHex: "#52b788", yield: "White P is tetrahedral P₄, chemiluminescent, highly toxic and pyrophoric; Red P is polymeric and stable." },
  { z: 16, sym: "S", name: "Sulfur", mass: "32.06", block: "p", category: "Reactive nonmetal", period: 3, group: 16, config: "[Ne] 3s² 3p⁴", ox: "-2, +4, +6", flame: "Blue flame", flameHex: "#48cae4", yield: "Crown-shaped S₈ rings; contact process for H₂SO₄ manufacture using V₂O₅ catalyst." },
  { z: 17, sym: "Cl", name: "Chlorine", mass: "35.45", block: "p", category: "Halogen", period: 3, group: 17, config: "[Ne] 3s² 3p⁵", ox: "-1 to +7", flame: "None", flameHex: "#a7c957", yield: "Highest negative electron gain enthalpy in the periodic table (higher than fluorine due to less inter-electronic repulsion)." },
  { z: 18, sym: "Ar", name: "Argon", mass: "39.95", block: "p", category: "Noble gas", period: 3, group: 18, config: "[Ne] 3s² 3p⁶", ox: "0", flame: "Lilac-Blue glow", flameHex: "#7209b7", yield: "Most abundant noble gas in atmosphere (~0.93% by volume); provides inert atmosphere for welding." },
  { z: 19, sym: "K", name: "Potassium", mass: "39.098", block: "s", category: "Alkali metal", period: 4, group: 1, config: "[Ar] 4s¹", ox: "+1", flame: "Lilac / Violet", flameHex: "#c77dff", yield: "Forms super-oxide KO₂ used in oxygen cylinders and submarines; essential cellular electrolyte." },
  { z: 20, sym: "Ca", name: "Calcium", mass: "40.078", block: "s", category: "Alkaline earth metal", period: 4, group: 2, config: "[Ar] 4s²", ox: "+2", flame: "Brick Red", flameHex: "#d90429", yield: "Forms quicklime (CaO), slaked lime (Ca(OH)₂), and Plaster of Paris (CaSO₄·½H₂O)." },
  { z: 24, sym: "Cr", name: "Chromium", mass: "51.996", block: "d", category: "Transition metal", period: 4, group: 6, config: "[Ar] 3d⁵ 4s¹", ox: "+2, +3, +6", flame: "None", flameHex: "#f77f00", yield: "Anomalous half-filled stability (3d⁵ 4s¹); K₂Cr₂O₇ is a powerful oxidizer in acidic medium." },
  { z: 25, sym: "Mn", name: "Manganese", mass: "54.938", block: "d", category: "Transition metal", period: 4, group: 7, config: "[Ar] 3d⁵ 4s²", ox: "+2 to +7", flame: "None", flameHex: "#9d4edd", yield: "Maximum oxidation states (+2 to +7); KMnO₄ is standard oxidizer in quantitative redox titrations." },
  { z: 26, sym: "Fe", name: "Iron", mass: "55.845", block: "d", category: "Transition metal", period: 4, group: 8, config: "[Ar] 3d⁶ 4s²", ox: "+2, +3", flame: "Gold Sparks", flameHex: "#e09f3e", yield: "Ferromagnetic; Haber process catalyst; forms Prussian blue Fe₄[Fe(CN)₆]₃ in Lassaigne's test." },
  { z: 29, sym: "Cu", name: "Copper", mass: "63.546", block: "d", category: "Transition metal", period: 4, group: 11, config: "[Ar] 3d¹⁰ 4s¹", ox: "+1, +2", flame: "Azure Blue / Green", flameHex: "#00b4d8", yield: "Anomalous fully-filled stability (3d¹⁰ 4s¹); Cu²⁺ is blue in aqueous solution due to d-d transition." },
  { z: 30, sym: "Zn", name: "Zinc", mass: "65.38", block: "d", category: "Post-transition metal", period: 4, group: 12, config: "[Ar] 3d¹⁰ 4s²", ox: "+2", flame: "Bluish-White", flameHex: "#90e0ef", yield: "Not considered a true transition element (completely filled d-orbitals in atom & ion); forms brass with Cu." },
  { z: 35, sym: "Br", name: "Bromine", mass: "79.904", block: "p", category: "Halogen", period: 4, group: 17, config: "[Ar] 3d¹⁰ 4s² 4p⁵", ox: "-1, +1, +3, +5", flame: "None", flameHex: "#9d0208", yield: "Only liquid non-metal at standard room temperature; red-brown fuming liquid; used in unsaturation test." },
  { z: 53, sym: "I", name: "Iodine", mass: "126.90", block: "p", category: "Halogen", period: 5, group: 17, config: "[Kr] 4d¹⁰ 5s² 5p⁵", ox: "-1, +1, +3, +5, +7", flame: "Violet Vapor", flameHex: "#7b2cbf", yield: "Sublimes directly from solid to deep violet gas; forms blue-black complex with starch; iodoform test for CH₃CO- group." },
  { z: 56, sym: "Ba", name: "Barium", mass: "137.33", block: "s", category: "Alkaline earth metal", period: 6, group: 2, config: "[Xe] 6s²", ox: "+2", flame: "Apple Green", flameHex: "#70e000", yield: "Imparts vivid apple green color to fireworks; BaSO₄ is insoluble in acid and used as radio-contrast agent." },
];

const HIGH_YIELD_REACTIONS = [
  {
    id: "aldol",
    name: "Aldol Condensation",
    category: "Carbonyls (Aldehydes & Ketones)",
    reagent: "Dilute NaOH / Ba(OH)₂ (Base catalyzed)",
    substrate: "Aldehyde or ketone containing at least one α-Hydrogen",
    product: "β-hydroxy aldehyde/ketone  →  α,β-unsaturated carbonyl (on heating)",
    equation: "2 CH₃CHO  --[dil. NaOH]-->  CH₃-CH(OH)-CH₂-CHO  --[Δ, -H₂O]-->  CH₃-CH=CH-CHO (Crotonaldehyde)",
    keyNote: "High yield in JEE Main & Advanced. If two different aldehydes are used, cross-aldol gives 4 distinct products.",
  },
  {
    id: "cannizzaro",
    name: "Cannizzaro's Reaction",
    category: "Carbonyls",
    reagent: "50% Concentrated NaOH or KOH",
    substrate: "Aldehydes with NO α-Hydrogens (HCHO, C₆H₅CHO, (CH₃)₃C-CHO)",
    product: "Equimolar mixture of Alcohol (reduction) and Carboxylate salt (oxidation)",
    equation: "2 C₆H₅CHO + conc. NaOH  -->  C₆H₅CH₂OH (Benzyl alcohol) + C₆H₅COONa (Sodium benzoate)",
    keyNote: "Disproportionation redox reaction. Hydride ion (H⁻) transfer is the slow rate-determining step (RDS).",
  },
  {
    id: "ozonolysis",
    name: "Reductive Ozonolysis",
    category: "Hydrocarbons (Alkenes & Alkynes)",
    reagent: "1. O₃ (Ozone), 2. Zn / H₂O (or (CH₃)₂S)",
    substrate: "Alkene (>C=C<)",
    product: "Aldehydes and/or Ketones (cleaves double bond completely)",
    equation: "R₂C=CHR'  --[1. O₃ / 2. Zn-H₂O]-->  R₂C=O + R'CHO",
    keyNote: "Crucial for locating the position of multiple bonds in unknown hydrocarbons. Zn prevents further oxidation of aldehydes to carboxylic acids.",
  },
  {
    id: "grignard",
    name: "Grignard Reagent Synthesis",
    category: "Organometallics",
    reagent: "R-Mg-X in Dry Ether",
    substrate: "Formaldehyde (gives 1° alc), other aldehydes (gives 2° alc), ketones (gives 3° alc), CO₂ (gives RCOOH)",
    product: "Alcohols with carbon-carbon chain elongation",
    equation: "R-MgX + R'CHO  -->  R-CH(OMgX)-R'  --[H₃O⁺]-->  R-CH(OH)-R' + Mg(OH)X",
    keyNote: "Grignard reagent acts as both a powerful nucleophile (R⁻) and an extremely strong base. Must be strictly anhydrous.",
  },
  {
    id: "reimer-tiemann",
    name: "Reimer-Tiemann Reaction",
    category: "Phenols",
    reagent: "CHCl₃ + aqueous NaOH, followed by H⁺",
    substrate: "Phenol (C₆H₅OH)",
    product: "Salicylaldehyde (o-hydroxybenzaldehyde)",
    equation: "C₆H₅OH + CHCl₃ + 3 NaOH  --[340 K]-->  o-HO-C₆H₄-CHO + 3 NaCl + 2 H₂O",
    keyNote: "Electrophile is neutral Dichlorocarbene (:CCl₂), formed by α-elimination of chloroform.",
  },
  {
    id: "kolbe",
    name: "Kolbe-Schmitt Reaction",
    category: "Phenols",
    reagent: "1. CO₂ (4-7 atm, 400 K), 2. H⁺",
    substrate: "Sodium phenoxide (C₆H₅ONa)",
    product: "Salicylic acid (o-hydroxybenzoic acid)  →  Precursor to Aspirin",
    equation: "C₆H₅ONa + CO₂  --[125°C, 5 atm]-->  o-HO-C₆H₄-COONa  --[H⁺]-->  Salicylic acid",
    keyNote: "Phenoxide ion activates the aromatic ring towards weak electrophile CO₂.",
  },
  {
    id: "hinsberg",
    name: "Hinsberg Test for Amines",
    category: "Amines & Nitrogen Compounds",
    reagent: "Benzenesulfonyl chloride (C₆H₅SO₂Cl)",
    substrate: "1°, 2°, and 3° aliphatic or aromatic amines",
    product: "1° amine gives sulfonamide soluble in alkali; 2° amine gives precipitate insoluble in alkali; 3° amine does not react.",
    equation: "R-NH₂ + C₆H₅SO₂Cl  -->  C₆H₅SO₂NH-R (Acidic H dissolves in KOH)",
    keyNote: "Top favorite distinction test in CBSE board exams, JEE Main, and NEET.",
  },
  {
    id: "lucas",
    name: "Lucas Test for Alcohols",
    category: "Alcohols",
    reagent: "Equimolar anhydrous ZnCl₂ + concentrated HCl (Lucas Reagent)",
    substrate: "1°, 2°, 3° Alcohols (R-OH)",
    product: "Alkyl chloride (R-Cl) producing immediate, delayed, or no turbidity",
    equation: "R-OH + HCl  --[anh. ZnCl₂]-->  R-Cl ↓ (Turbidity) + H₂O",
    keyNote: "3° alcohol gives turbidity IMMEDIATELY; 2° alcohol gives turbidity in 5 minutes; 1° alcohol produces no turbidity at room temp.",
  },
];

export function ChemNexus() {
  const [activeTab, setActiveTab] = useState("periodic"); // "periodic" | "reactions"
  const [selectedBlock, setSelectedBlock] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeElement, setActiveElement] = useState(ELEMENTS_DATA[2]); // Default Lithium
  const [reactionFilter, setReactionFilter] = useState("all");
  const [copiedId, setCopiedId] = useState(null);

  const filteredElements = ELEMENTS_DATA.filter((el) => {
    const matchesBlock = selectedBlock === "all" || el.block === selectedBlock;
    const matchesSearch = searchTerm === "" ||
      el.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      el.sym.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(el.z) === searchTerm.trim();
    return matchesBlock && matchesSearch;
  });

  const filteredReactions = HIGH_YIELD_REACTIONS.filter((rxn) => {
    if (reactionFilter === "all") return true;
    return rxn.category.toLowerCase().includes(reactionFilter.toLowerCase());
  });

  const handleCopyEquation = (rxn) => {
    soundEngine.playClick();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`${rxn.name}\n${rxn.equation}\nReagent: ${rxn.reagent}`);
      setCopiedId(rxn.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  return (
    <div className="page-wrap chem-nexus-container" data-reveal>
      {/* Header Banner */}
      <header className="chem-header-banner">
        <div className="chem-kicker-row">
          <span className="chem-atom-icon">⚛</span>
          <span className="chem-kicker-text">INTERACTIVE CHEMICAL MATRIX</span>
          <span className="chem-badge-tag">JEE · NEET 2026 EDITION</span>
        </div>
        <h1 className="chem-headline">
          Modern Periodic Table &amp; <em>High-Yield Vault</em>
        </h1>
        <p className="chem-subtext">
          Explore electronic configurations, orbital blocks, simulated flame test emissions, and the complete high-yield organic reagent matrix.
        </p>

        {/* Tab Switcher */}
        <div className="chem-tabs-nav" role="tablist">
          <button
            type="button"
            className={`chem-tab-btn ${activeTab === "periodic" ? "is-active" : ""}`}
            onClick={() => {
              soundEngine.playClick();
              setActiveTab("periodic");
            }}
          >
            ⚛ Periodic Matrix &amp; Flame Lab
          </button>
          <button
            type="button"
            className={`chem-tab-btn ${activeTab === "reactions" ? "is-active" : ""}`}
            onClick={() => {
              soundEngine.playClick();
              setActiveTab("reactions");
            }}
          >
            🧪 Organic Reagents &amp; Name Reactions
          </button>
        </div>
      </header>

      {activeTab === "periodic" ? (
        <section className="chem-periodic-section" aria-label="Periodic table section">
          {/* Controls Bar: Blocks & Search */}
          <div className="chem-controls-bar">
            <div className="chem-block-filters" role="group" aria-label="Filter by orbital block">
              {[
                { id: "all", label: "All Blocks" },
                { id: "s", label: "s-Block (Alkali & Earth)" },
                { id: "p", label: "p-Block (Chalcogens & Halogens)" },
                { id: "d", label: "d-Block (Transition Metals)" },
              ].map((btn) => (
                <button
                  key={btn.id}
                  type="button"
                  className={`chem-filter-pill ${selectedBlock === btn.id ? "is-active" : ""}`}
                  onClick={() => {
                    soundEngine.playClick();
                    setSelectedBlock(btn.id);
                  }}
                >
                  {btn.label}
                </button>
              ))}
            </div>

            <div className="chem-search-wrap">
              <span className="search-icon">⌕</span>
              <input
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search element (e.g., Fe, Sodium, 24)"
                className="chem-search-input"
              />
            </div>
          </div>

          <div className="chem-stage-layout">
            {/* Element Grid */}
            <div className="chem-element-grid" role="region" aria-label="Element buttons">
              {filteredElements.map((el) => {
                const isSelected = activeElement.z === el.z;
                return (
                  <button
                    key={el.z}
                    type="button"
                    className={`chem-element-tile tile-block-${el.block} ${isSelected ? "is-active-tile" : ""}`}
                    onClick={() => {
                      soundEngine.playClick();
                      setActiveElement(el);
                    }}
                    style={{
                      "--flame-accent": el.flameHex,
                    }}
                    title={`${el.name} (Z = ${el.z})`}
                  >
                    <span className="tile-z">{el.z}</span>
                    <strong className="tile-sym">{el.sym}</strong>
                    <span className="tile-name">{el.name}</span>
                    <span className="tile-mass">{el.mass}</span>
                  </button>
                );
              })}
            </div>

            {/* Element Holo-Inspector Sidebar */}
            <aside className="chem-inspector-panel" aria-label="Element details">
              <HoloTiltCard className="chem-holo-card" maxTilt={10}>
                <div className="inspector-head">
                  <div className="inspector-top-row">
                    <span className="inspector-z">ATOMIC NUMBER #{activeElement.z}</span>
                    <span className={`inspector-block-badge block-${activeElement.block}`}>
                      {activeElement.block.toUpperCase()}-BLOCK
                    </span>
                  </div>

                  <div className="inspector-symbol-hero">
                    <strong className="inspector-sym">{activeElement.sym}</strong>
                    <div>
                      <h2 className="inspector-name">{activeElement.name}</h2>
                      <span className="inspector-category">{activeElement.category}</span>
                    </div>
                  </div>
                </div>

                <div className="inspector-specs-grid">
                  <div className="spec-card">
                    <span className="spec-label">ATOMIC WEIGHT</span>
                    <strong className="spec-value">{activeElement.mass} u</strong>
                  </div>
                  <div className="spec-card">
                    <span className="spec-label">OXIDATION STATES</span>
                    <strong className="spec-value">{activeElement.ox}</strong>
                  </div>
                  <div className="spec-card spec-wide">
                    <span className="spec-label">ELECTRONIC CONFIGURATION</span>
                    <code className="spec-value spec-config">{activeElement.config}</code>
                  </div>
                </div>

                {/* Simulated Flame Test Chamber */}
                <div className="flame-test-chamber">
                  <div className="flame-info-row">
                    <span className="flame-label">SIMULATED FLAME TEST:</span>
                    <span className="flame-color-name" style={{ color: activeElement.flameHex }}>
                      {activeElement.flame}
                    </span>
                  </div>
                  <div className="flame-visualizer-box">
                    <div
                      className="simulated-flame"
                      style={{
                        "--flame-glow": activeElement.flameHex,
                      }}
                      aria-hidden="true"
                    >
                      <div className="flame-core" />
                      <div className="flame-sparkle" />
                    </div>
                    <span className="flame-note">
                      {activeElement.flame === "None"
                        ? "Does not emit visible flame color due to high excitation energy."
                        : `Excited electrons de-excite to emit characteristic ${activeElement.flame} photons.`}
                    </span>
                  </div>
                </div>

                {/* High Yield JEE/NEET Insight */}
                <div className="inspector-yield-box">
                  <span className="yield-badge">★ EXAM HIGH-YIELD INSIGHT</span>
                  <p className="yield-text">{activeElement.yield}</p>
                </div>
              </HoloTiltCard>
            </aside>
          </div>
        </section>
      ) : (
        /* Organic Reactions & Reagents Vault */
        <section className="chem-reactions-section" aria-label="Reactions vault">
          <div className="reactions-filter-bar">
            {["all", "Carbonyls", "Hydrocarbons", "Phenols", "Amines", "Alcohols"].map((cat) => (
              <button
                key={cat}
                type="button"
                className={`reaction-filter-btn ${reactionFilter === cat ? "is-active" : ""}`}
                onClick={() => {
                  soundEngine.playClick();
                  setReactionFilter(cat);
                }}
              >
                {cat === "all" ? "All Reactions" : cat}
              </button>
            ))}
          </div>

          <div className="reactions-grid">
            {filteredReactions.map((rxn) => (
              <HoloTiltCard key={rxn.id} className="reaction-card" maxTilt={6}>
                <div className="reaction-card-header">
                  <div>
                    <span className="reaction-cat-tag">{rxn.category}</span>
                    <h3 className="reaction-title">{rxn.name}</h3>
                  </div>
                  <button
                    type="button"
                    className="reaction-copy-btn"
                    onClick={() => handleCopyEquation(rxn)}
                    title="Copy reaction formula"
                  >
                    {copiedId === rxn.id ? "✓ Copied" : "Copy ⎘"}
                  </button>
                </div>

                <div className="reaction-reagents-box">
                  <div className="reagent-row">
                    <span className="reagent-label">REAGENT:</span>
                    <strong className="reagent-value">{rxn.reagent}</strong>
                  </div>
                  <div className="reagent-row">
                    <span className="reagent-label">SUBSTRATE:</span>
                    <span className="reagent-value">{rxn.substrate}</span>
                  </div>
                </div>

                <div className="reaction-equation-box">
                  <span className="equation-tag">CHEMICAL EQUATION:</span>
                  <pre className="reaction-equation-text">{rxn.equation}</pre>
                </div>

                <div className="reaction-footer-note">
                  <span className="note-star">✳</span>
                  <p className="note-body">{rxn.keyNote}</p>
                </div>
              </HoloTiltCard>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
