# IFC-TS Demo

This interactive demo for exploring **Information Flow Control (IFC)** using security lattices and labeled data flows lets you:

- Define lattices of security labels (e.g. *Low ≤ High*).  
- Create labeled data sources and compose flows with transformations and joins.  
- Define sinks with required labels and test writes against IFC rules.  
- Visualize flows, violations, and explanations using React Flow.

<img width="1388" height="905" alt="image" src="https://github.com/user-attachments/assets/f0fe360d-eac8-4327-a54a-bd1d12c39142" />


---

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/<your-org>/ifc-ts-demo.git
   cd ifc-ts-demo
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the dev server:
   ```bash
   npm run dev
   ```
   The demo will be available at http://localhost:5173.

### Credits

This project builds on and demonstrates concepts from [ifc-ts](https://github.com/willardthor/ifc-ts),
a TypeScript library for information flow control.

### Runtime vs Compile-Time

The original `ifc-ts` package focuses on *compile-time* enforcement: TypeScript’s type system ensures
your lattice, principals, and flows are sound during development. This demo flips the perspective to a
*runtime* sandbox where you can create labels, edges, and flows on the fly. That means the interactive
UI maintains its own lattice state, materialises joins/meets dynamically, and surfaces violations in
real time—even when the relationships you explore never existed in the original TypeScript source.
