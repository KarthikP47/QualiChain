# BOSM Project - Demo Video Walkthrough & Script

This document provides a step-by-step guide for recording a demo video of the BOSM project. It outlines the visual actions to perform on-screen alongside the voiceover script to explain the features. 

## Video Pacing & Tips
- **Pacing**: Speak clearly and at a moderate pace. Pause slightly between major sections (e.g., transitioning from the social feed to the blockchain chat).
- **Recording Tools**: Use tools like OBS Studio or Loom for high-quality screen recording. 
- **Preparation**: Ensure your backend, frontend, and Hardhat nodes are all running smoothly before starting the recording. Have a test account already created.

---

## Scene 1: Introduction & Landing Page
**Objective:** Hook the viewer, introduce the platform's purpose, and showcase the premium UI.

| Element | Details |
| :--- | :--- |
| **Visual / Action** | 1. Start on the landing/login page. <br>2. Slowly move the cursor over the UI to show any dynamic hover effects and the custom background/particles. <br>3. Log into a pre-existing account. |
| **Voiceover Script** | "Welcome to BOSM, a next-generation decentralized social platform that seamlessly blends community engagement with Web3 technology. Right from the start, our platform features a highly responsive, premium design. Let's log in and see what's inside." |

## Scene 2: The Social Feed & Search Functionality
**Objective:** Demonstrate the core social networking features and the optimized search functionality.

| Element | Details |
| :--- | :--- |
| **Visual / Action** | 1. Scroll through the main feed showing user posts and football-themed UI elements. <br>2. Click to 'upvote' a post. <br>3. Navigate to the search bar and type a query using mixed casing (e.g., "MeSsi" or "bOSton"). <br>4. Press enter and show the accurately returned search results. |
| **Voiceover Script** | "At its core, BOSM provides a rich social feed where users can share content, upvote posts, and interact. We've optimized the content discovery process with a robust, case-insensitive search engine, making it incredibly easy to find exactly what you're looking for, no matter how it's typed." |

## Scene 3: Web3 Integration & The $BOSM Token
**Objective:** Highlight the smart contract integration, the $BOSM token, and the gamified badge system.

| Element | Details |
| :--- | :--- |
| **Visual / Action** | 1. Navigate to the User Profile or Token Claiming section. <br>2. Click the button to claim a reward or interact with the smart contract. <br>3. **Crucial:** Let the animated modal sequence play out fully, showing the interaction with the blockchain. <br>4. Navigate to the 'Badges' page to show the gamified collection of earned and unearned Web3 badges. |
| **Voiceover Script** | "What truly sets BOSM apart is our native Web3 integration. Users are rewarded for their engagement with our native token, $BOSM. When claiming tokens, the platform directly interacts with our smart contracts on the blockchain, which you can see through this secure, real-time transaction process. These tokens unlock unique achievements and verifiable badges." |

## Scene 4: Decentralized Real-Time Chat
**Objective:** Showcase the real-time websocket chat backed by blockchain smart contracts.

| Element | Details |
| :--- | :--- |
| **Visual / Action** | 1. Click on the "Chat" navigation link. <br>2. Create a new chat room (e.g., "Web3 Developers"). <br>3. Point out the success message confirming the room was verified/created on the blockchain. <br>4. Enter the room and type a message like "Hello from the demo!". Hit send and show it appearing instantly. |
| **Voiceover Script** | "Our platform also features a secure, real-time messaging system. When a new chat room is created, it is actually registered and verified on the blockchain, providing a tamper-proof layer of security. Once inside, the WebSockets take over, allowing for lightning-fast, real-time communication between members." |

## Scene 5: Outro & Conclusion
**Objective:** Wrap up the presentation and summarize the tech stack.

| Element | Details |
| :--- | :--- |
| **Visual / Action** | 1. Navigate back to the main feed or Profile page. <br>2. Slowly scroll to show the overall aesthetic one last time. <br>3. Fade to black or show a slide with the project name and logo. |
| **Voiceover Script** | "By combining a modern React frontend with a robust Node.js backend and Hardhat-powered smart contracts, BOSM delivers a seamless, gamified Web3 experience. Thank you for watching our demo." |

---

## 🎬 Pre-Flight Checklist Before Recording
- [ ] Ensure `npx hardhat node` is running.
- [ ] Ensure backend (`npm run dev`) and frontend (`npm run dev`) are running without errors.
- [ ] Clear browser cache or use an Incognito window to avoid any old session data.
- [ ] Have a specific search query prepared that you know will return good results.
- [ ] Ensure your test account has enough mock activity (posts, upvotes) to make the feed look active.
