function MovieIcon({ size = 32, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Outer Glow / Background Circle */}
      <rect width="24" height="24" rx="6" fill="#E50914" />
      
      {/* Play Button Symbol */}
      <polygon points="10,7 17,12 10,17" fill="#FFFFFF" />
      
      {/* Film Reel Accent Lines */}
      <rect x="3" y="2" width="18" height="2" rx="1" fill="#FFFFFF" opacity="0.3" />
      <rect x="3" y="20" width="18" height="2" rx="1" fill="#FFFFFF" opacity="0.3" />
    </svg>
  );
}

export default MovieIcon;