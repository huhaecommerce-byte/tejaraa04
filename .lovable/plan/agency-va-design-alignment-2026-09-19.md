# Agency & VA design alignment

## Goal
Bring the Agency & VA experience up to the same polished visual standard as Selling, while keeping partner authentication visually separate from the public programme pages and signed-in workspace.

## What will change
- Align the agency public header, page spacing, typography, section treatment, and calls to action with the established Selling design language.
- Restyle the signed-in agency workspace to match the Selling seller workspace structure: branded top bar, responsive sidebar, light workspace background, consistent content width, and mobile navigation.
- Create a dedicated agency authentication shell for sign-in, application/sign-up, email verification, success, and password reset states. It will use a focused split-screen partner presentation on desktop and a compact branded experience on mobile, without the public header/footer.
- Keep all existing application, approval, referral, commission, payout, and profile behavior unchanged.

## Technical details
- Add a reusable agency authentication layout and reuse existing semantic theme tokens and design-system controls.
- Update agency sign-in, apply/sign-up, forgot-password, and their intermediate states to use that layout.
- Update the agency workspace layout without changing routes or data access.
- Preserve existing route metadata and verify all affected pages at desktop and mobile sizes.
