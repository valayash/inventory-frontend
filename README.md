# Inventory Management System - Frontend

This is the frontend for the Inventory Management System, built with React and TypeScript. It provides a user-friendly interface for both distributors and shop owners to manage inventory, sales, and analytics.

## Key Features

The frontend is divided into two main portals based on user roles.

### 1. Distributor Portal
- **Dashboard**: A central hub with quick access to all distributor functions.
- **Shop Management**: An interface to create, view, edit, search, and delete shops.
- **Product Catalog**: View and manage the entire catalog of eyeglass frames.
- **Inventory Distribution**: A powerful page to distribute inventory to multiple shops simultaneously in a single bulk operation. Includes a searchable frame dropdown and auto-populated cost data.
- **Shop Inventory Detail View**: Drill down into the specific inventory of any shop, add stock manually, or upload stock via CSV.
- **Billing**: Generate detailed, itemized monthly bills for each shop.
- **Analytics Dashboard**: A comprehensive analytics suite with interactive charts and tables for:
    - Sales trends over time
    - Top-selling products
    - Shop performance comparisons
    - Revenue summaries
    - Low-stock alerts

### 2. Shop Owner Portal
- **Dashboard**: A summary of the shop's monthly performance (sales, revenue, items in stock) and quick actions.
- **Inventory Management**: View and search the shop's current inventory with real-time stock levels.
- **Sales Processing**: A dedicated page to record new sales, including lens selection.
- **Analytics Dashboard**: A personalized analytics view with detailed charts and reports on the shop's performance, including sales trends, top products, and slow-moving items.

## Technology Stack

- **Framework**: React (Create React App)
- **Language**: TypeScript
- **Routing**: React Router
- **HTTP Client**: Axios
- **Charting**: Chart.js
- **Styling**: Standard CSS with a modern, modular approach.

## Setup and Installation

Follow these steps to get the frontend server up and running on your local machine.

### Prerequisites
- Node.js and npm (or yarn) installed.
- The backend server must be running on `http://127.0.0.1:8001`.

### 1. Navigate to the Frontend Directory

```bash
cd inventory-management-system/inventory-frontend
```

### 2. Install Dependencies

Install all the required npm packages.

```bash
npm install
```
or if you use yarn:
```bash
yarn install
```

### 3. Start the Development Server

Run the start script to launch the React development server. It will typically run on port 3000.

```bash
npm start
```
or
```bash
yarn start
```

The application will open automatically in your default browser at `http://localhost:3000`.

## Project Structure

The project follows a standard Create React App structure with some organizational conventions:

- **`src/`**: Contains all the source code for the application.
    - **`components/`**: Shared, reusable components used across multiple pages (e.g., `LoginPage`, `ProtectedRoute`, `BillingModal`).
    - **`pages/`**: Top-level components that represent a full page or a major feature view (e.g., `DistributorPage`, `ShopOwnerDashboard`, `AnalyticsPage`).
    - **`utils/`**: Utility functions, such as authentication helpers (`auth.ts`).
    - **`App.tsx`**: The main application component that sets up routing.
    - **`App.css`**: Global styles for the application.

## Available Scripts

In the project directory, you can run:

- **`npm start`**: Runs the app in development mode.
- **`npm test`**: Launches the test runner in interactive watch mode.
- **`npm run build`**: Builds the app for production to the `build` folder.
- **`npm run eject`**: Removes the single build dependency from your project. Note: this is a one-way operation.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).
