
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="flex justify-between items-center p-4 bg-slate-900 text-white">
      <h1 className="font-bold">U-SPORT</h1>

      <div className="flex gap-4 items-center">
        <span className="text-sm">{user?.name}</span>

        <button onClick={handleLogout} className="btn-primary">
          Logout
        </button>
      </div>
    </div>
  );
}

