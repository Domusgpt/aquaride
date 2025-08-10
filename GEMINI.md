# GEMINI.md - AquaRide: The "Uber for Boats" Project (Firebase Edition)

## 🌟 Project Vision: A Seamless On-Demand Boating Experience

The goal of AquaRide is to create a premier ride-sharing platform for watercraft, connecting boat owners with passengers seeking on-demand water travel. This project will deliver a robust, scalable, and user-friendly MVP that captures the core functionality of an "Uber for Boats," focusing on safety, reliability, and a seamless user experience.

## 🎯 Core Objectives

1.  **Multi-Tiered User System:** Create a platform that caters to a variety of user roles with different levels of access and permissions:
    *   **Passengers:** Users who can request, book, and pay for boat rides.
    *   **Captains:** Verified and licensed operators who can list their boats, accept ride requests, and manage their schedules.
    *   **Admins:** Superusers with full access to the platform for managing users, boats, rides, and other administrative tasks.
    *   **Customer Support:** Users with access to a dedicated dashboard for resolving user issues and managing support tickets.
2.  **Real-Time Ride Booking:** Implement a system for real-time ride requests, matching passengers with nearby available boats.
3.  **Safe and Secure Payments:** Integrate a secure payment gateway to handle all transactions, including ride fares, tips, and potential surcharges.
4.  **Interactive Mapping:** Provide a map-based interface for passengers to set pickup and drop-off locations, and for all users to track the boat's location in real-time.
5.  **Comprehensive Rating System:** Implement a two-way rating and review system for both passengers and captains, with detailed feedback categories.
6.  **Safety First:** Integrate essential safety features, including captain verification, vessel compliance checks, and an in-app emergency assistance feature.
7.  **Lost and Found:** A system for reporting and tracking lost items.

## 🏗️ Architectural Overview

AquaRide will be built using a modern, scalable, and maintainable architecture:

*   **Frontend:** A responsive web application built with **React** to ensure a seamless experience on both desktop and mobile devices.
*   **Backend:** A serverless backend powered by **Firebase**, including:
    *   **Firebase Authentication:** For user registration, login, and role-based access control.
    *   **Firestore:** As the primary NoSQL database for storing all application data.
    *   **Cloud Functions for Firebase:** for running backend code in response to events triggered by Firebase features and HTTPS requests.
*   **Mapping and Geolocation:** Integration with a reliable mapping service (e.g., Mapbox or Google Maps) for location-based services.
*   **Payment Gateway:** Integration with a secure payment provider (e.g., Stripe or Braintree) to handle all financial transactions.

## 🔬 Key Technologies

*   **Frontend:** React, JavaScript/TypeScript, CSS3, HTML5, Axios
*   **Backend:** Firebase (Authentication, Firestore, Cloud Functions)
*   **Mapping:** Mapbox or Google Maps API
*   **Payments:** Stripe or Braintree API
*   **Deployment:** Firebase Hosting

## 📋 Phased Implementation Plan

### Phase 1: Core Backend and User Authentication (High Priority)

**Objective:** Establish the Firebase backend and implement a robust user authentication system with role-based access control.

1.  **Firebase Project Setup:** Create a new Firebase project and set up Firestore and Firebase Authentication.
2.  **Data Modeling:** Design and implement the Firestore data models for Users, Boats, and Rides, with a focus on scalability and security.
3.  **User Authentication:** Implement user registration and login with Firebase Authentication, including email/password and social login options.
4.  **Role-Based Access Control (RBAC):** Implement a system for assigning roles to users (Passenger, Captain, Admin, Customer Support) and controlling their access to different parts of the application.

### Phase 2: Core Frontend and Ride Request Logic (High Priority)

**Objective:** Build the essential frontend components and implement the ride request workflow.

1.  **Frontend Setup:** Set up the React application and integrate it with the Firebase backend.
2.  **Map Integration:** Integrate the chosen mapping service to display a map and allow users to select pickup and drop-off locations.
3.  **Ride Request Flow:**
    *   **Passenger:** Implement the UI for requesting a ride, including selecting the boat type and viewing fare estimates.
    *   **Backend:** Develop the Cloud Functions to find nearby available boats and notify their captains of a new ride request.
    *   **Captain:** Create the UI for receiving and responding to ride requests (accept/decline).

### Phase 3: In-Ride Experience & Payments (Medium Priority)

**Objective:** Develop the features for the in-ride experience and integrate the payment system.

1.  **Live Tracking:** Implement real-time location tracking of the boat on the passenger's map during the ride.
2.  **Ride State Management:** Manage the different states of a ride (e.g., "accepted," "in-progress," "completed," "canceled") on both the frontend and backend.
3.  **Payment Integration:** Integrate the chosen payment gateway to handle ride payments, including pre-authorization and final charges.
4.  **Trip Completion:** Implement the logic for completing a trip, calculating the final fare, and processing the payment.

### Phase 4: Advanced Features (Medium Priority)

**Objective:** Add features to enhance the user experience and build trust.

1.  **Rating System:** Implement the two-way rating and review system.
2.  **Ride History:** Create a feature for users to view their past rides and receipts.
3.  **Lost and Found:** Implement the lost and found system.
4.  **Administrative Dashboard:** Design and develop a web-based dashboard for admins to manage the platform.
5.  **Customer Support Dashboard:** Design and develop a web-based dashboard for customer support to manage user issues.

### Phase 5: Refinement, Optimization & Deployment (Ongoing)

**Objective:** Ensure a high-quality, performant, and well-documented application.

1.  **Performance Tuning:** Optimize Firestore queries, Cloud Function execution times, and frontend rendering performance.
2.  **Mobile Responsiveness:** Ensure the React application is fully responsive and provides a great user experience on all screen sizes.
3.  **Testing:** Write unit and integration tests for both the backend and frontend to ensure code quality and prevent regressions.
4.  **Deployment:** Deploy the application to Firebase Hosting.

This `GEMINI.md` will serve as the living blueprint for the AquaRide project.
