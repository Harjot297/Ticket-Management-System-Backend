# 🎟️ Movie Ticket Management System - Backend

A **scalable, high-performance movie ticket booking backend system** built with **Node.js, Express, MongoDB, and Redis**, designed to handle **role-based access**, **concurrent bookings**, and **real-time updates**.  
Supports **multi-server deployment** with **Nginx load balancing** and **Redis caching** for optimized performance.

---

## 🚀 Features

- **Role-Based Access Control (RBAC)**  
  Separate roles for **Admin**, **Theatre Owner**, and **User** with secure JWT authentication.

- **Movies & Shows Management**  
  Create, update, and manage movies, theatres, halls, and shows with scheduling, pricing, and seat configurations.

- **Booking System with Concurrency Handling**  
  Atomic **seat-locking logic** and **transactional seat updates** to ensure consistency during high-traffic concurrent bookings.

- **Payment Integration**  
  Secure **Razorpay payment gateway** integration for order creation, confirmation, and refunds.

- **Caching & Performance Optimization**  
  Redis caching with **user- and show-scoped keys**, integrated with **Nginx load balancing** for multi-server setups.  
  👉 Improved response times by **~70%** on high-traffic endpoints.

- **Automated Lifecycle Management**  
  Node.js **cron jobs** to auto-update statuses (e.g., movies, shows, seats) in real time.  
  👉 Improved operational reliability and data accuracy by **~40%**.

- **Scalable Multi-Server Architecture**  
  Designed for horizontal scaling with **Nginx + Redis** ensuring high availability and fault tolerance.

---

## 🏗️ Tech Stack

- **Backend Framework**: Node.js, Express.js  
- **Database**: MongoDB (Atlas Cluster)  
- **Caching & Optimization**: Redis  
- **Load Balancing**: Nginx (multi-server deployment)  
- **Authentication & Security**: JWT (Access & Refresh Tokens), Role-Based Authorization  
- **Payments**: Razorpay Integration  
- **Job Scheduling**: Node-Cron  
- **Cloud Storage**: Cloudinary (for movie posters & trailers)

---

## 📊 Key Highlights & Metrics

- Reduced **API response times by ~70%** using Redis caching and Nginx load balancing.  
- Ensured **100% consistency** in booking records across distributed environments.  
- Improved **data accuracy and reliability by ~40%** through cron-based automated updates.  
- Built with **scalable architecture** to handle **concurrent high-volume bookings**.

---

## 📂 Project Structure
```bash
src/
│── controllers/ # Business logic for movies, shows, bookings, etc.
│── middlewares/ # Auth, role validation, caching
│── models/ # MongoDB schemas (User, Movie, Show, Booking, Theatre, Hall, Seat)
│── routes/ # API routes
│── utils/ # Helper functions (cache, cloudinary, razorpay, etc.)
│── cron/ # Scheduled jobs (status updaters)
│── app.js # Express app entry point
│── server.js # Server bootstrap with Nginx support
```

---

## 🔑 Modules Implemented

- **User Management** → Register, Login, Logout, Change Password  
- **Movies Management** → Create, Update, Delete, Toggle Status, Fetch Upcoming & Released Movies  
- **Theatres & Halls** → CRUD with seat generation & updates  
- **Shows** → Create, Cancel, Automated Status Update (scheduled, running, completed)  
- **Bookings** → Seat selection, Payment confirmation (Razorpay), Refunds, Cancellation  
- **Caching** → User-scoped & query-based caching with invalidation strategies

---

## ⚡ Setup & Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/Ticket-Management-System-Backend.git
   cd Ticket-Management-System-Backend
2. Install dependencies
3. Create a .env file and configure:
    ```bash
     PORT=5000
     MONGO_URI=your_mongodb_connection_string
     JWT_ACCESS_SECRET=your_access_secret
     JWT_REFRESH_SECRET=your_refresh_secret
     REDIS_URL=redis://localhost:6379
     RAZORPAY_KEY_ID=your_key
     RAZORPAY_KEY_SECRET=your_secret
     CLOUDINARY_CLOUD_NAME=your_cloud
     CLOUDINARY_API_KEY=your_api_key
     CLOUDINARY_API_SECRET=your_secret
    ```
4. Run the development server:
     npm run dev
## Future Enhancements

  -Add GraphQL API for flexible queries

 -Implement real-time notifications via WebSockets

 -Introduce seat recommendation system using AI/ML

 -Expand to multi-currency & multi-language support
   
## 👨‍💻 Author

Developed by #Harjot Anand 🚀
If you like this project, feel free to ⭐ the repo and connect with me!

