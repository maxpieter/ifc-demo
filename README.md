# IFC-TS Demo

An interactive React + TypeScript app for exploring **Information Flow Control (IFC)** using security lattices and labeled data flows.  
This demo lets you:

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
