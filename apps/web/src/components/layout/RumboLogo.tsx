export function RumboLogo({ size = 42 }: { size?: number }) {
  return (
    <div className="brand">
      <svg
        className="brand-logo-svg"
        width={size}
        height={size}
        viewBox="0 0 512 512"
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="512" height="512" rx="112" fill="#6B2948" />
        <path
          d="M126 354V158h92c63 0 105 31 105 87 0 35-17 61-48 75l90 34h-94l-66-29v29h-79zm79-97h19c24 0 37-9 37-28s-13-27-37-27h-19v55z"
          fill="#FFF8F0"
        />
        <circle cx="365" cy="152" r="42" fill="#E3A72F" />
      </svg>
      <strong className="brand-name">Rumbo</strong>
    </div>
  );
}
