// src/App.jsx
import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Home from "./pages/Home";
import AddItem from "./pages/AddItem";
import BookItem from "./pages/BookItem";
import MyBookings from "./pages/MyBookings";
import RequestedBookings from "./pages/RequestedBookings";
import EditItem from "./pages/EditItem";
import Items from "./pages/Items";


function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    if (storedUser && token) setUser(JSON.parse(storedUser));
    setLoading(false);
  }, []);

  if (loading)
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <h3>Loading...</h3>
      </div>
    );

  return (
    <Router>
      {user && <Navbar onSearch={setSearchTerm} />}
      <div>
        <Routes>
          <Route path="/login" element={!user ? <Login /> : <Navigate to="/home" />} />
          <Route path="/signup" element={!user ? <Signup /> : <Navigate to="/home" />} />
          <Route path="/home" element={user ? <Home searchTerm={searchTerm} /> : <Navigate to="/login" />} />
          <Route path="/" element={<Navigate to="/home" />} />

          <Route path="/add-item" element={user?.user_type === "Faculty" ? <AddItem /> : <Navigate to="/home" />} />
          <Route path="/book-item" element={user ? <BookItem /> : <Navigate to="/login" />} />
          <Route path="/my-bookings" element={user ? <MyBookings /> : <Navigate to="/login" />} />
          <Route
            path="/requested-bookings"
            element={user?.user_type === "Faculty" ? <RequestedBookings /> : <Navigate to="/home" />}
          />
          <Route path="/edit-item" element={user?.user_type === "Faculty" ? <EditItem /> : <Navigate to="/home" />} />
          <Route path="/items" element={user ? <Items searchTerm={searchTerm} /> : <Navigate to="/login" />} />

        </Routes>
      </div>
    </Router>
  );
}

export default App;
