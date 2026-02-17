# GEA Planner: Full-Stack To-Do App

Welcome to the GEA Planner. If you are coming from the world of C, Microcontrollers, or MATLAB, this project might look like magic, but it’s just a different kind of signal processing.

This app allows us to track assignments across our 3GEA S2 classes, saving data to the cloud so we can access it from our phones at any time.

## The Tech Stack (The "Hardware")

In C, you manage memory and registers. In Web Dev, we use these three pillars:
1. Node.js, React and Vite (The Logic)

    Node.js: Think of this as the Runtime Environment. Just like you need a specific compiler for your PIC or Arduino, Node.js allows your computer to run JavaScript outside of a browser. This is purely for developpement purposes. 

    React: This is NOT Node.js. React is a "UI Library." If C is the assembly language, React is like a high-level GUI framework. It allows us to build "Components" (like our Class Boxes) that update automatically when data changes.

   Vite : Think of Vite as the compiler. Web browsers only speak Javascript (like a computer only speaks binary), so we need to convert our React code into Javascript, via Vite. 

3. Supabase (The Memory/EEPROM)

    The Problem: Normally, when you turn off a program, the variables reset.

    The Solution: Supabase is our Cloud Database. Instead of saving data to a local .txt file or flash memory, we send a JSON packet to Supabase. It stores it in a table (like a spreadsheet) that stays alive forever.

4. Vercel (The Power Supply/Server)

    Usage: Vercel is our Hosting Provider. It takes our code from GitHub (the source code of the app) and puts it on a professional server that is always running. This gives us a public URL so we don't have to keep our laptops open to see the app.

## How to Contribute (The "Boot Sequence")

If you want to help code this, follow these steps to get the environment running on your machine:

1. Clone the Project:

    Type in your terminal (PowerShell for windows users) in the folder(directory) where you want to keep the project/app: 

    git clone https://github.com/YOUR_USERNAME/gea-planner.git

2. Install Dependencies (tools):

   2.1 Open your terminal in the folder and run:

    npm install

    (This is like downloading all the header files .h you need for a C project).

    2.2 Run the "Dev" Server (type the following command):

    npm run dev

    This starts a local server (local web view of the app, meaning that changes done to the project are local; go nuts). Open the link it gives you (usually localhost:5173).

    Live Reload: Any change you save in VS Code will instantly update the browser. No need to re-compile for 5 minutes!

## Project Structure

    src/App.jsx: The main brain of the app. It contains the logic for fetching tasks and the HTML-like code (JSX) that draws the boxes.

    src/supabaseClient.js: The communication protocol. It tells the app the "IP address" and "API Key" for our database.

    src/App.css: The "Schematic" for the UI. This controls the colors, the grid layout, and the spacing.

## Key Concepts (for C Programmers)

    State (useState): In C, you might use a global variable to track a sensor reading. In React, we use "State." When the state changes, the UI "re-renders" (re-draws itself) automatically.

    Side Effects (useEffect): Think of this like an Interrupt. We use it to say: "As soon as the app powers on, go fetch the data from the database."

    The Database Insert: We aren't writing to addresses in RAM. We use supabase.from('ToDo').insert(), which is essentially sending a structured command over the internet (API call).

## Deployment Flow

We use a "Continuous Integration" workflow:

    Code on your laptop.

    git push to GitHub.

    Vercel (our server) detects the push, "compiles" the code, and updates the live website automatically.

Let's build the best planner in the GEA department! 
