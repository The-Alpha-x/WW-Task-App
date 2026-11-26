"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import type { AddOption } from "@/lib/navigation";

const EASE_OUT = [0.22, 1, 0.36, 1] as const;

export interface AddOptionCardProps {
  option: AddOption;
  index: number;
  total: number;
}

export function AddOptionCard({ option, index, total }: AddOptionCardProps) {
  const reduce = useReducedMotion();

  const variants: Variants = {
    hidden: reduce ? { opacity: 0 } : { opacity: 0, y: 18 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: reduce ? 0.2 : 0.45, ease: EASE_OUT },
    },
  };

  return (
    <motion.article
      data-add-card
      aria-label={`${index + 1} of ${total}: ${option.title}`}
      variants={variants}
      whileHover={reduce ? undefined : { y: -4 }}
      whileTap={reduce ? undefined : { scale: 0.985 }}
      className="group relative aspect-[3/2] w-full overflow-hidden rounded-xl bg-surface/80 ring-1 ring-glass-border/10 transition-shadow duration-base ease-standard hover:ring-glass-border/20 sm:aspect-[4/5]"
    >
      <Image
        src={option.image}
        alt={option.title}
        fill
        draggable={false}
        priority={index === 0}
        sizes="(min-width: 1024px) 33vw, (min-width: 480px) 50vw, 100vw"
        className="pointer-events-none z-0 object-cover transition-transform duration-slow ease-standard group-hover:scale-[1.03]"
      />

      {/* Bottom dark vignette matching Activities cards */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-background via-background/55 to-transparent"
      />

      <Link
        href={option.href}
        aria-label={`Add ${option.title}`}
        className="absolute inset-0 z-20 flex flex-col justify-between p-5"
      >
        <span className="flex justify-end">
          <ArrowUpRight
            aria-hidden="true"
            size={20}
            strokeWidth={1.85}
            className="text-on-dark-muted transition-all duration-base ease-standard group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-on-dark"
          />
        </span>

        <span className="flex flex-col gap-1">
          <h2 className="text-xl font-bold text-on-dark">{option.title}</h2>
          <p className="text-xs font-medium text-on-dark-muted">
            {option.description}
          </p>
        </span>
      </Link>
    </motion.article>
  );
}
