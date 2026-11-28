"use client";

import {
  useId,
  useState,
  type FormEvent,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";
import {
  AnimatePresence,
  motion,
  useAnimationControls,
  useReducedMotion,
  type Variants,
} from "framer-motion";
import { ArrowRight, Check, Eye, EyeOff, LoaderCircle, Lock, User } from "lucide-react";
import { HeroIllustration } from "./hero-illustration";

export type LoginValues = { email: string; password: string };

type Props = {
  /** Resolve on success, throw/reject on bad credentials. */
  onSubmit: (values: LoginValues) => Promise<void>;
  /** Called after the success animation finishes (e.g. router.push("/")). */
  onSuccess?: () => void;
};

type Status = "idle" | "loading" | "success";

const EASE_OUT = [0.22, 1, 0.36, 1] as const;
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

const stagger = (delay: number): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: delay } },
});

const rise: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE_OUT } },
};

export function LoginScreen({ onSubmit, onSuccess }: Props) {
  const reduce = useReducedMotion();
  const shake = useAnimationControls();
  const errorId = useId();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  const initial = reduce ? "show" : "hidden";

  function fail(message: string) {
    setError(message);
    if (!reduce) shake.start({ x: [0, -10, 10, -6, 6, 0], transition: { duration: 0.4 } });
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status !== "idle") return;

    if (!email.trim() || !password) {
      fail("Enter your email and password.");
      return;
    }

    setError(null);
    setStatus("loading");
    try {
      await onSubmit({ email: email.trim(), password });
      setStatus("success");
      await wait(reduce ? 150 : 700);
      onSuccess?.();
    } catch (cause) {
      setStatus("idle");
      fail(
        cause instanceof Error
          ? cause.message
          : "Could not sign in. Please try again.",
      );
    }
  }

  return (
    <div className="login-screen relative isolate min-h-dvh overflow-hidden bg-background font-sans text-on-dark">
      <Backdrop reduce={!!reduce} />

      {/* On success the whole screen scales up and fades into the next page */}
      <motion.div
        animate={status === "success" && !reduce ? { opacity: 0, scale: 1.06 } : { opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: EASE_OUT }}
        className="relative mx-auto flex min-h-dvh w-full max-w-[1120px] flex-col px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] sm:px-6 lg:grid lg:grid-cols-2 lg:items-center lg:gap-10 lg:px-10"
      >
        {/* Left on desktop, top on mobile */}
        <section className="flex flex-col items-center">
          <HeroIllustration className="w-full max-w-[390px] lg:max-w-[560px] [@media(max-height:700px)]:max-w-[280px]" />

          <motion.div
            variants={stagger(0.6)}
            initial={initial}
            animate="show"
            className="-mt-1 flex flex-col items-center gap-3 text-center"
          >
            <motion.h1 variants={rise} className="flex items-center gap-3 type-h1">
              <svg width="42" height="42" viewBox="0 0 42 42" fill="none" aria-hidden="true">
                <path d="M33 21a12 12 0 11-6.5-10.6" stroke="rgb(var(--color-lime))" strokeWidth="3.5" strokeLinecap="round" />
                <path d="M14 22l5.5 5.5L33 12" stroke="rgb(var(--color-lime))" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Witch-Woofie
            </motion.h1>
            <motion.p variants={rise} className="text-base text-on-dark-muted">
              Plan it together. Get it done.
            </motion.p>
          </motion.div>
        </section>

        {/* Right on desktop, bottom on mobile */}
        <section className="mx-auto mt-8 flex w-full max-w-[420px] flex-1 flex-col lg:mt-0 lg:flex-none">
          <motion.form
            onSubmit={handleSubmit}
            noValidate
            variants={stagger(0.9)}
            initial={initial}
            animate="show"
            className="flex flex-col gap-4"
          >
            <motion.p variants={rise} className="mb-2 hidden text-lg text-on-dark-muted lg:block">
              Sign in to your shared workspace.
            </motion.p>

            <motion.div animate={shake}>
              <motion.div
                variants={stagger(1)}
                initial={initial}
                animate="show"
                className="flex flex-col gap-4"
              >
                <motion.div variants={rise}>
                  <Field
                    icon={<User size={22} strokeWidth={1.8} />}
                    invalid={!!error}
                    type="email"
                    name="email"
                    aria-label="Email address"
                    placeholder="Email address"
                    autoComplete="email"
                    inputMode="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    aria-describedby={error ? errorId : undefined}
                  />
                </motion.div>

                <motion.div variants={rise}>
                  <Field
                    icon={<Lock size={22} strokeWidth={1.8} />}
                    invalid={!!error}
                    type={showPassword ? "text" : "password"}
                    name="password"
                    aria-label="Password"
                    placeholder="Password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    aria-describedby={error ? errorId : undefined}
                    trailing={
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        aria-pressed={showPassword}
                        className="flex h-12 w-12 items-center justify-center rounded-full text-on-dark-muted transition-colors hover:text-on-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime"
                      >
                        {showPassword ? <Eye size={22} strokeWidth={1.8} /> : <EyeOff size={22} strokeWidth={1.8} />}
                      </button>
                    }
                  />
                </motion.div>
              </motion.div>
            </motion.div>

            <AnimatePresence initial={false}>
              {error && (
                <motion.p
                  id={errorId}
                  role="alert"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden px-2 text-sm font-semibold text-destructive"
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            <motion.div variants={rise}>
              <motion.button
                type="submit"
                disabled={status !== "idle"}
                whileTap={reduce ? undefined : { scale: 0.98 }}
                className="flex h-[62px] w-full items-center justify-center rounded-full bg-gradient-to-b from-lime-soft to-lime text-lg font-bold text-ink shadow-glow transition-shadow hover:shadow-[0_10px_28px_rgb(var(--color-lime)_/_0.22)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-on-dark focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-default"
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={status}
                    initial={reduce ? false : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduce ? undefined : { opacity: 0, y: -8 }}
                    transition={{ duration: 0.18 }}
                    className="flex items-center gap-3"
                  >
                    {status === "idle" && (
                      <>
                        Sign in <ArrowRight size={22} strokeWidth={2.4} />
                      </>
                    )}
                    {status === "loading" && (
                      <>
                        <motion.span
                          animate={reduce ? undefined : { rotate: 360 }}
                          transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
                          className="flex"
                        >
                          <LoaderCircle size={22} strokeWidth={2.4} />
                        </motion.span>
                        Signing in
                      </>
                    )}
                    {status === "success" && (
                      <>
                        Signed in <Check size={22} strokeWidth={2.8} />
                      </>
                    )}
                  </motion.span>
                </AnimatePresence>
              </motion.button>
            </motion.div>
          </motion.form>

          <motion.p
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.6, duration: 0.6 }}
            className="mt-auto flex items-center justify-center gap-2 pt-8 text-sm text-on-dark-muted lg:mt-10 lg:pt-0"
          >
            <Lock size={16} strokeWidth={2} className="text-lime" aria-hidden="true" />
            Invite-only. Your login is created for you.
          </motion.p>
        </section>
      </motion.div>
    </div>
  );
}

/* ---------- pieces ---------- */

type FieldProps = {
  icon: ReactNode;
  trailing?: ReactNode;
  invalid?: boolean;
} & InputHTMLAttributes<HTMLInputElement>;

function Field({ icon, trailing, invalid, ...input }: FieldProps) {
  return (
    <div
      className={`group flex h-[58px] items-center gap-3 rounded-full border-[1.5px] bg-surface pl-[22px] transition-[border-color,box-shadow] duration-200 ${
        trailing ? "pr-[7px]" : "pr-[22px]"
      } ${
        invalid
          ? "border-danger"
          : "border-surface-raised focus-within:border-lime focus-within:shadow-[0_0_0_4px_rgb(var(--color-lime)_/_0.12)]"
      }`}
    >
      <span className="text-on-dark-muted transition-colors group-focus-within:text-lime">{icon}</span>
      <input
        {...input}
        aria-invalid={invalid || undefined}
        className="min-w-0 flex-1 bg-transparent text-base text-on-dark outline-none placeholder:text-on-dark-muted"
      />
      {trailing}
    </div>
  );
}

/** Soft lime glow that breathes behind the hero + thin lime curves in the corners. */
function Backdrop({ reduce }: { reduce: boolean }) {
  return (
    <>
      <motion.div
        aria-hidden="true"
        animate={reduce ? undefined : { opacity: [0.75, 1, 0.75] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-none absolute left-1/2 top-[14%] -z-10 size-[460px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgb(var(--color-lime)_/_0.07),transparent_70%)] lg:left-[27%] lg:top-1/2 lg:-translate-y-1/2"
      />
      <svg
        aria-hidden="true"
        viewBox="0 0 390 844"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
        className="pointer-events-none absolute inset-0 -z-10 h-full w-full"
      >
        <defs>
          <linearGradient id="ww-curve-a" x1="390" y1="0" x2="250" y2="180" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="rgb(var(--color-lime))" stopOpacity="0.55" />
            <stop offset="1" stopColor="rgb(var(--color-lime))" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="ww-curve-b" x1="0" y1="844" x2="390" y2="690" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="rgb(var(--color-lime))" stopOpacity="0" />
            <stop offset="1" stopColor="rgb(var(--color-lime))" stopOpacity="0.5" />
          </linearGradient>
        </defs>
        <path d="M345 0 C 340 90, 300 150, 220 185" stroke="url(#ww-curve-a)" strokeWidth="1.5" />
        <path d="M390 150 C 340 150, 300 110, 292 60" stroke="url(#ww-curve-a)" strokeWidth="1" opacity="0.6" />
        <path d="M0 835 C 140 815, 300 800, 390 690" stroke="url(#ww-curve-b)" strokeWidth="1.5" />
        <path d="M60 844 C 200 820, 330 790, 390 740" stroke="url(#ww-curve-b)" strokeWidth="1" opacity="0.6" />
      </svg>
    </>
  );
}
