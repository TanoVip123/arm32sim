# ARM32 Simulator (React + Vite)

A browser-based ARM32 instruction simulator built using **React**, **Vite**, and **TypeScript**.  
This project provides an interactive environment to write ARM assembly, simulate CPU execution, and visualize registers, flags, and memory changes in real time.

The webapp is hosted at [arm32sim.vercel.app](https://arm32sim.vercel.app/)

---

## 🚀 Features

- **ARM32 Instruction Execution**  
  Supports common ARM32 data-processing, memory, and branch instructions. (Please see the documentation page of the web app)

- **Live Code Editor**  
  Write and edit ARM assembly directly in the browser.

- **Step-by-Step Simulation**  
  Inspect register values, flags, and memory after each instruction.

- **Memory and Register Viewer**  
  Display RAM (4GB), PC, CPSR, and general registers.

- **Fast Vite Dev Server**  
  Near-instant hot reload for rapid development.

---

## 📦 Tech Stack

- **React** – UI layer
- **Vite** – fast dev server and build system
- **TypeScript** – type-safe CPU and instruction logic
- **TailwindCSS** – styling
- **Vitest** – testing
- **ESLint + Prettier** – formatting and linting

---

## 🛠️ Installation

```bash
git clone https://github.com/yourname/arm32-simulator.git
cd arm32-simulator
npm install
```

## 📜 Commands

### Start the local development server

```
npm run dev
```

### Format all file using Prettier

```
npm run format
```

### Run the test suit

```
npm run test
```

### Run ESLint

```
npm run lint
```

### Build the project

```
npm run build
```

## Project structure

- **./components**: contains the backend component of the ARM32 simulator
- **./constants**: contains well... constants for various files
- **./function**: contains helper functions
- **./interface**: contains the interface definitions for ARM32 simulator components
- **./pages**: contains the React pages. These are simpy React function components
- **./types**: contains the type definitions. This also contains the types of various ARM32 instructions that are used to assemble and decode an instruction. This is because ARM32 instructions are organized into groups so I used Typescript type to represent these groups.
- **./webComponent**: similar to what is in **./pages** but smaller. These are little components that can be reused.

* **./test**: contains unit test. This is what being run when you do `npm run test`.
