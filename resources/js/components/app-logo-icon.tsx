import { SVGAttributes } from 'react';

export default function AppLogoIcon(props: SVGAttributes<SVGElement>) {
    return (
        <svg
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            {...props}
        >
            {/* Hexagonal Bunker Fortress Shell */}
            <path
                d="M16 2.5L28 8.5V23.5L16 29.5L4 23.5V8.5L16 2.5Z"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinejoin="round"
                fill="none"
            />
            {/* Forward Crew Apex Chevron (Field Dispatch Team) */}
            <path
                d="M16 7L23 11.5L16 16L9 11.5L16 7Z"
                fill="currentColor"
            />
            {/* Bunker Security Vault Chamber */}
            <path
                d="M11 18L16 15L21 18V24L16 27L11 24V18Z"
                fill="currentColor"
                fillOpacity="0.3"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinejoin="round"
            />
            {/* Dispatch Telemetry Beacon Core */}
            <circle cx="16" cy="21" r="1.8" fill="currentColor" />
        </svg>
    );
}
