"use client";

// HeroVideo — the home hero's background layer.
//
// Replaces HeroCarousel (four cross-fading field photos) with the brand ad
// clip. Positioned `absolute inset-0` exactly as the carousel was, so it is
// a drop-in: the scrim, the edge gradient, the headline, the CTAs and the
// TrustedByStrip in HeroSection are untouched and keep their stacking.
//
// ── Encoding ───────────────────────────────────────────────────────────
// The master is 360 MB — 36s of 1080p25 at ~79 Mbps, an editing export.
// Shipping that would have made the home page unusable. What is served:
//
//   hero-1080.mp4   5.6 MB   H.264 high, CRF 32, no audio, faststart
//   hero-720.mp4    3.0 MB   same, 1280×720, for narrow viewports
//   hero-poster.webp  82 KB  the video's FIRST frame
//
// CRF 32 is harder compression than a foreground video would take, and it
// is justified here specifically because the hero applies a uniform 60%
// black scrim over this layer: fine detail is not visible, so bits spent
// on it are wasted. Verified by compositing source and CRF 32 frames under
// that same scrim at 1:1 — indistinguishable.
//
// Audio is stripped entirely (`-an`), not just muted in markup. A hero
// background is silent by definition, so the track was pure weight.
//
// `faststart` moves the moov atom to the head of the file so playback can
// begin before the whole thing has arrived. VP9 was tested and came out
// LARGER than H.264 on this footage (9.3 MB vs 6.0), so there is no WebM.
//
// ── Behaviour ──────────────────────────────────────────────────────────
// The poster is the video's own first frame, so the handover from image to
// playback is invisible. `preload="metadata"` rather than "auto": the
// poster carries first paint at 82 KB and the video streams in behind it,
// instead of racing 5.6 MB against the headline.
//
// prefers-reduced-motion gets the poster and no autoplay. Not decoration
// we can hand-wave — a full-bleed moving background is exactly what that
// setting exists to suppress.

import { useEffect, useState } from "react";
import Image from "next/image";

const POSTER = "/video/hero-poster.webp";

export function HeroVideo({ alt }: { alt: string }) {
  // Assume motion is fine, then stand down if the OS says otherwise. The
  // check has to run on the client, and defaulting to "reduced" would make
  // every first paint a still even for the majority who want the video.
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduceMotion(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  if (reduceMotion) {
    return (
      <div className="absolute inset-0">
        <Image
          src={POSTER}
          alt={alt}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      </div>
    );
  }

  return (
    <div className="absolute inset-0">
      <video
        // Decorative: the headline carries the meaning, and the clip has no
        // narration. Hidden from assistive tech rather than given a label
        // that would just be read over the real content.
        aria-hidden
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        poster={POSTER}
        disablePictureInPicture
        controls={false}
        className="h-full w-full object-cover"
      >
        {/* Narrow viewports take the 720p cut — 3.0 MB instead of 5.6 MB,
            and at phone width the extra lines are invisible anyway. Order
            matters: the media-qualified source must come first, and a
            browser that ignores `media` simply falls through to the 1080p
            file below. */}
        <source
          src="/video/hero-720.mp4"
          type="video/mp4"
          media="(max-width: 768px)"
        />
        <source src="/video/hero-1080.mp4" type="video/mp4" />
      </video>
    </div>
  );
}
