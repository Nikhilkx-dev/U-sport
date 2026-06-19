
import { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  // 🔁 Check user on reload
  useEffect(() => {
    const init = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) return;

        const res = await api.get("/auth/profile");
        setUser(res.data.data);
      } catch (err) {
        localStorage.clear();
      } finally {
        setLoading(false);
        setInitialized(true);
      }
    };

    init();
  }, []);

  // 🔐 STEP 1: LOGIN → send OTP
  const login = async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    return res.data;
  };

  // 🔐 STEP 2: VERIFY OTP → get tokens + user
  const verifyOtp = async (email, otp) => {
    const res = await api.post("/auth/verify-otp", { email, otp });

    const { accessToken, refreshToken, user: userData } = res.data.data;

    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);

    setUser(userData);

    // Return the user object directly for role-based redirects
    return userData;
  };

  // 🔐 STEP 3: RESEND OTP
  const resendOtp = async (email) => {
    const res = await api.post("/auth/resend-otp", { email });
    return res.data;
  };

  // 📝 Register new user
  const register = async (userData) => {
    const res = await api.post("/auth/register", userData);
    return res.data;
  };

  // ✏️ Update profile
  const updateProfile = async (profileData) => {
    const res = await api.put("/auth/profile", profileData);
    setUser(res.data.data);
    return res.data;
  };

  // 🚪 Logout
  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {}
    localStorage.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        verifyOtp,
        resendOtp,
        register,
        updateProfile,
        logout,
        loading,
        initialized,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
