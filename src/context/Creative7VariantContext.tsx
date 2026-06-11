import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from 'react';

/* The Creative 7 ("Reiterate the plan") guideline ships in two flavors:
 *  - tablet    : full chat shell — side nav, avatar, plan card, prompt bar.
 *                Mirrors the Figma tablet layout.
 *  - plan-only : just the centered chat thread (user turn + AI turn with the
 *                plan card). No shell chrome, no prompt bar. Useful to focus
 *                attention on the guideline itself.
 *
 * The toggle UI lives in the existing top-right "info" overlay
 * (GuidelineOverlay in App.tsx); this tiny context lets the two coordinate
 * without prop-drilling.
 */

export type Creative7Variant = 'tablet' | 'plan-only';

interface Creative7VariantContextValue {
  variant: Creative7Variant;
  setVariant: (next: Creative7Variant) => void;
}

const Creative7VariantContext =
  createContext<Creative7VariantContextValue | null>(null);

export function Creative7VariantProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [variant, setVariant] = useState<Creative7Variant>('plan-only');
  return (
    <Creative7VariantContext.Provider value={{ variant, setVariant }}>
      {children}
    </Creative7VariantContext.Provider>
  );
}

/* Safe accessor — returns null if used outside the provider so the
 * generic GuidelineOverlay can no-op on other routes.              */
export function useCreative7Variant(): Creative7VariantContextValue | null {
  return useContext(Creative7VariantContext);
}
