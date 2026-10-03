import { useMovieContext } from "../contexts/MovieContext";
import "../css/Toast.css";

function Toast() {
  const { toast } = useMovieContext();

  if (!toast) return null; // Render nothing if there is no active toast

  return (
    <div className={`toast-container ${toast.type}`}>
      <span className="toast-message">{toast.message}</span>
    </div>
  );
}

export default Toast;