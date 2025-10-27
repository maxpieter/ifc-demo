# IFC-TS Demo

Interactive demo for exploring **Information Flow Control (IFC)** using security lattices and labeled data flows:

- Define lattices of security labels (e.g. *Low ≤ High*).  
- Create labeled data sources and compose flows with transformations and joins.  
- Define sinks with required labels and test writes against IFC rules.  
- Visualize flows, violations, and explanations using React Flow.
- NEW! Understand how your GUI changes translate to IFC safe code using the [ifc-ts](https://github.com/willardthor/ifc-ts) library

<img width="599" height="805" alt="image" src="https://github.com/user-attachments/assets/7bbe9b6e-fd09-4a20-9194-545112e6aa44" />


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

... or just visit [maxpieter.github.io/ifc-ts-demo](https://maxpieter.github.io/ifc-ts-demo/)

## Credits

This project builds on and demonstrates concepts from [ifc-ts](https://github.com/willardthor/ifc-ts),
a TypeScript library for information flow control.

### Runtime vs Compile-Time

The original `ifc-ts` package focuses on *compile-time* enforcement: TypeScript’s type system ensures
your lattice, principals, and flows are sound during development. This demo flips the perspective to a
*runtime* sandbox where you can create labels, edges, and flows on the fly. That means the interactive
UI maintains its own lattice state, materialises joins/meets dynamically, and surfaces violations in
real time.
