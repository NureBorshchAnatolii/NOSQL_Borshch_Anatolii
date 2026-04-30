import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./routes/ProtectedRoute";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Tests from "./pages/Tests";
import TakeTest from "./pages/TakeTest";
import TestBuilder from "./pages/TestBuilder";
import Profile from "./pages/Profile";
import Categories from "./pages/Categories";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route
            path="/login"
            element={
              <>
                <Navbar />
                <Login />
              </>
            }
          />
          <Route
            path="/register"
            element={
              <>
                <Navbar />
                <Register />
              </>
            }
          />

          <Route
            path="/tests"
            element={
              <ProtectedRoute>
                <Navbar />
                <Tests />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tests/:testId/take"
            element={
              <ProtectedRoute>
                <TakeTest />
              </ProtectedRoute>
            }
          />
          <Route
            path="/builder"
            element={
              <ProtectedRoute>
                <Navbar />
                <TestBuilder />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Navbar />
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/categories"
            element={
              <ProtectedRoute>
                <Navbar />
                <Categories />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/tests" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
