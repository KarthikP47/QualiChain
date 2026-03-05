import { useMemo } from 'react';
import { minidenticon } from 'minidenticons';

export default function Avatar({ username, avatarUrl, width = "32", height = "32", style = {} }) {
    // Generate the SVG data URI using minidenticons
    const svgURI = useMemo(
        () => 'data:image/svg+xml;utf8,' + encodeURIComponent(minidenticon(username || "Guest")),
        [username]
    );

    return (
        <img
            src={avatarUrl || svgURI}
            alt={`${username}'s avatar`}
            width={width}
            height={height}
            style={{
                borderRadius: "50%",
                background: "var(--bg-soft)",
                border: "1px solid var(--border-subtle)",
                objectFit: "cover",
                ...style
            }}
        />
    );
}
