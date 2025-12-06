# Beloop POS System (Enterprise)

## Overview
A high-performance, local-first Restaurant POS built with Next.js, PostgreSQL, and Redis.
Designed to integrate seamlessly with the existing **Beloop Tracker**.

## Tech Stack
- **Frontend**: Next.js 14 (App Router), Tailwind CSS, Zustand (State), TanStack Query (Sync).
- **Backend**: Next.js API Routes, Prisma ORM, PostgreSQL.
- **Cache**: Redis.
- **Infrastructure**: Docker.

## Getting Started

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Environment Setup**:
    Copy `.env.example` to `.env` and update values.

3.  **Run Database**:
    ```bash
    docker-compose up -d postgres redis
    ```

4.  **Run Development Server**:
    ```bash
    npm run dev
    ```

## Beloop Integration
This POS syncs data to the Beloop Tracker:
- **Inventory**: Sales trigger `StockMove` creation in Beloop.
- **Financials**: End-of-day sales are pushed to Beloop's `Sale` ledger.
- **Menu**: POS fetches product list from Beloop to map SKUs.

## Project Structure
- `/src/app`: Next.js App Router pages.
- `/src/lib/store.ts`: Local POS logic (Cart, Offline Queue).
- `/src/services/sync.ts`: Beloop Integration logic.
- `/prisma/schema.prisma`: Database schema.
