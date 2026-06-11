import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from 'react';

/* The Expert 1 ("Lead the conversation") guideline ships in two flavors:
 *  - phone       : full mobile bezel — 375 × 720 with rounded corners,
 *                  drop shadow, and a sticky prompt bar at the bottom.
 *  - screen-only : the exact contents of the phone screen — top bar,
 *                  conversation, and prompt bar — with no bezel. The card
 *                  grows naturally, no sticky bottom.
 *
 * The toggle UI lives in the existing top-right "info" overlay
 * (GuidelineOverlay in App.tsx); this tiny context lets the two coordinate
 * without prop-drilling.
 */

export type Expert1Variant = 'phone' | 'screen-only';

interface Expert1VariantContextValue {
  variant: Expert1Variant;
  setVariant: (next: Expert1Variant) => void;
}

const Expert1VariantContext =
  createContext<Expert1VariantContextValue | null>(null);

export function Expert1VariantProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [variant, setVariant] = useState<Expert1Variant>('screen-only');
  return (
    <Expert1VariantContext.Provider value={{ variant, setVariant }}>
      {children}
    </Expert1VariantContext.Provider>
  );
}

/* Safe accessor — returns null if used outside the provider so the
 * generic GuidelineOverlay can no-op on other routes.              */
export function useExpert1Variant(): Expert1VariantContextValue | null {
  return useContext(Expert1VariantContext);
}
