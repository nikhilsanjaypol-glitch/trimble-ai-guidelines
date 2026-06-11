import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from 'react';

/* The Creative 3 ("Provide options") guideline ships in two flavors:
 *  - with-moves : interactive, the professional toggles signature moves
 *                 on each direction to customize the plan.
 *  - no-moves   : showcase, each direction is shown as a complete plan
 *                 with no per-feature toggling.
 *
 * The toggle UI for switching between the two lives inside the
 * existing top-right "info" overlay (GuidelineOverlay in App.tsx),
 * but the Creative3 component is the one that consumes the value.
 * This tiny context lets the two coordinate without prop-drilling.
 */

export type Creative3Variant = 'with-moves' | 'no-moves';

interface Creative3VariantContextValue {
  variant: Creative3Variant;
  setVariant: (next: Creative3Variant) => void;
}

const Creative3VariantContext =
  createContext<Creative3VariantContextValue | null>(null);

export function Creative3VariantProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [variant, setVariant] = useState<Creative3Variant>('no-moves');
  return (
    <Creative3VariantContext.Provider value={{ variant, setVariant }}>
      {children}
    </Creative3VariantContext.Provider>
  );
}

/* Safe accessor — returns null if used outside the provider so the
 * generic GuidelineOverlay can no-op on other routes.              */
export function useCreative3Variant(): Creative3VariantContextValue | null {
  return useContext(Creative3VariantContext);
}
