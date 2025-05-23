import { useEffect, useState } from "react";

export default function BackToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > 200);
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleClick = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return visible ? (
    <button
      onClick={handleClick}
      className="fixed bottom-8 right-8 z-50 rounded-full bg-primary text-primary-foreground shadow-lg px-4 py-2 text-sm font-semibold hover:bg-primary/90 transition"
      aria-label="Back to top"
    >
      ↑ Top
    </button>
  ) : null;
}