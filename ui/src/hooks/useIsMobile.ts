import { useEffect, useState } from "react";

/**
 * Responsive hook that tracks window width and detects mobile viewport.
 * Updates state on window resize events; unsubscribes on unmount.
 *
 * @param breakpoint Window width threshold in pixels (default: 768 for tablet breakpoint).
 * @returns True if window width is below breakpoint, false otherwise.
 */
export function useIsMobile(breakpoint: number = 768): boolean {
    const [isMobile, setIsMobile] = useState(window.innerWidth < breakpoint);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < breakpoint);
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [breakpoint]);

    return isMobile;
}
