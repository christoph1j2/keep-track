import { useEffect, useState } from "react";

/**
 * Tracks whether the viewport is below a chosen breakpoint.
 * The value updates on resize and automatically cleans up listeners on unmount.
 *
 * @param breakpoint Pixel threshold used to classify mobile layout, defaults to 768.
 * @returns True when the viewport width is smaller than the breakpoint.
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
