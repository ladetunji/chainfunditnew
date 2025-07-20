"use client";

import React from "react";
import Image from "next/image";

type Props = {};

const Partners = (props: Props) => {
  return (
    <div className="w-full h-[200px] bg-[#F2F1E9] px-4 md:px-10 py-6 flex flex-col md:flex-row gap-4 md:gap-5 items-start md:items-center">
      {/* Fixed "Our Partners" text */}
      <p className="font-source font-semibold text-xl md:text-3xl text-black whitespace-nowrap mb-3 md:mb-0">
        Our Partners
      </p>
      {/* Infinite sliding partners carousel with blur masks */}
      <div className="flex-1 overflow-hidden">
        <div
          className="relative w-full overflow-hidden"
          style={{
            position: "relative",
            width: "100%",
            height: "80px",
          }}
        >
          <style jsx>{`
            @keyframes partners-slide {
              0% {
                transform: translateX(0%);
              }
              100% {
                transform: translateX(-50%);
              }
            }
            .partners-slider-track {
              display: flex;
              gap: 0.75rem; /* gap-3 */
              align-items: center;
              width: max-content;
              height: 80px;
              animation: partners-slide 20s linear infinite;
            }
          `}</style>
          <div className="absolute left-0 top-0 h-full w-10 bg-gradient-to-r from-[#F2F1E9] to-transparent z-10" />
          <div className="absolute right-0 top-0 h-full w-10 bg-gradient-to-l from-[#F2F1E9] to-transparent z-10" />
          <div className="partners-slider-track relative z-0">
            {/* Repeat the list twice for seamless infinite effect */}
            {[
              {
                src: "/images/together-to-win.png",
                alt: "Together to win",
              },
              {
                src: "/images/tahmamuq.png",
                alt: "Tahmamuq",
              },
              {
                src: "/images/100bmol.png",
                alt: "100bmol",
              },
              {
                src: "/images/nspcc.png",
                alt: "NSPCC",
              },
              {
                src: "/images/cece-yara.png",
                alt: "Cece Yara",
              },
              {
                src: "/images/meningitis.png",
                alt: "Meningitis",
              },
            ]
              .concat([
                {
                  src: "/images/together-to-win.png",
                  alt: "Together to win",
                },
                {
                  src: "/images/tahmamuq.png",
                  alt: "Tahmamuq",
                },
                {
                  src: "/images/100bmol.png",
                  alt: "100bmol",
                },
                {
                  src: "/images/nspcc.png",
                  alt: "NSPCC",
                },
                {
                  src: "/images/cece-yara.png",
                  alt: "Cece Yara",
                },
                {
                  src: "/images/meningitis.png",
                  alt: "Meningitis",
                },
              ])
              .map((partner, idx) => (
                <div key={idx} className="flex-shrink-0 min-w-[200px] flex items-center justify-center">
                  {typeof partner.src === "string" && typeof partner.alt === "string" && (
                    <Image
                      src={partner.src as string}
                      alt={partner.alt}
                      width={200}
                      height={80}
                    />
                  )}
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Partners;
