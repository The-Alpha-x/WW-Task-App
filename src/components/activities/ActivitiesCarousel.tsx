"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

const EASE_OUT = [0.22, 1, 0.36, 1] as const;

const activityItems = [
  {
    id: 1,
    url: "/images/memories-view-card.webp",
    title: "Memory Lane",
  },
  {
    id: 2,
    url: "/images/budget-calculator-card.webp",
    title: "Budget Calculator",
  },
  {
    id: 3,
    url: "/images/movies-card.webp",
    title: "Watch Movies",
  },
  {
    id: 4,
    url: "/images/randomizer-card.webp",
    title: "Randomizer",
  },
] as const;

export function ActivitiesCarousel({
  moviesDomain,
}: {
  moviesDomain?: string;
}) {
  const reduce = useReducedMotion();
  const [confirmMoviesNavigation, setConfirmMoviesNavigation] = useState(false);

  const container: Variants = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: reduce ? 0 : 0.08,
        delayChildren: reduce ? 0 : 0.04,
      },
    },
  };

  const cardVariants: Variants = {
    hidden: reduce ? { opacity: 0 } : { opacity: 0, y: 18 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: reduce ? 0.2 : 0.45, ease: EASE_OUT },
    },
  };

  return (
    <section aria-label="Featured activities" className="flex flex-col gap-4">
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        {activityItems.map((item, index) => (
          <motion.article
            key={item.id}
            aria-label={`${index + 1} of ${activityItems.length}: ${item.title}`}
            variants={cardVariants}
            whileHover={reduce ? undefined : { y: -4 }}
            whileTap={reduce ? undefined : { scale: 0.985 }}
            className="group relative aspect-[3/2] w-full overflow-hidden rounded-xl bg-surface/80 ring-1 ring-glass-border/10 transition-shadow duration-base ease-standard hover:ring-glass-border/20 sm:aspect-[4/5]"
          >
            <Image
              src={item.url}
              alt={item.title}
              fill
              draggable={false}
              priority={index === 0}
              sizes="(min-width: 1024px) 33vw, (min-width: 480px) 50vw, 100vw"
              className="pointer-events-none z-0 object-cover transition-transform duration-slow ease-standard group-hover:scale-[1.03]"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-background via-background/55 to-transparent"
            />
            {item.title === "Budget Calculator" ? (
              <Link
                href="/activities/budget-calculator"
                aria-label="Open Budget Calculator"
                className="absolute inset-0 z-20 flex items-end p-5"
              >
                <h2 className="text-xl font-bold text-on-dark">{item.title}</h2>
              </Link>
            ) : item.title === "Watch Movies" && moviesDomain ? (
              <a
                href={moviesDomain}
                aria-label={`Open ${item.title}`}
                className="absolute inset-0 z-20 flex items-end p-5"
                onClick={(event) => {
                  event.preventDefault();
                  setConfirmMoviesNavigation(true);
                }}
              >
                <h2 className="text-xl font-bold text-on-dark">{item.title}</h2>
              </a>
            ) : item.title === "Watch Movies" ? (
              <div className="absolute inset-x-5 bottom-5 z-20">
                <h2 className="text-xl font-bold text-on-dark">{item.title}</h2>
                <p className="mt-1 text-xs text-on-dark-muted">
                  Link unavailable
                </p>
              </div>
            ) : (
              <div className="absolute inset-x-5 bottom-5 z-20">
                <h2 className="text-xl font-bold text-on-dark">{item.title}</h2>
              </div>
            )}
          </motion.article>
        ))}
      </motion.div>

      <Modal
        open={confirmMoviesNavigation}
        onClose={() => setConfirmMoviesNavigation(false)}
        title="Visit Watch Movies?"
        description="You are about to leave this app and visit the Watch Movies site."
        footer={
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConfirmMoviesNavigation(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => {
                if (moviesDomain) window.location.assign(moviesDomain);
              }}
            >
              Continue
            </Button>
          </>
        }
      />
    </section>
  );
}
