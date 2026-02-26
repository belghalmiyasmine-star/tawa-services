---
phase: 10-panneau-administration
plan: "03"
subsystem: admin-ui
tags: [admin, services, categories, table, tree-view, crud, server-actions, react-hook-form, zod]

dependency_graph:
  requires:
    - phase: 10-01
      provides: admin server actions for service approve/suspend, admin i18n namespace
  provides:
    - Service management data table with approve/suspend/featured actions
    - Category tree view with full CRUD (create/edit/delete/toggle)
    - /admin/services page with search, status and category filters
    - /admin/categories page with hierarchical tree view
    - category-actions.ts: getCategoriesTreeAction, createCategoryAction, updateCategoryAction, deleteCategoryAction, toggleCategoryActiveAction
    - toggleFeaturedAction added to admin-actions.ts
  affects:
    - AdminSidebar (Services nav item added)
    - Phase 11 (admin panel fully navigable)

tech-stack:
  added: []
  patterns:
    - Server component page + client DataTable pattern (URL search params as filter state)
    - Client-side tree building from flat array (parent-child grouping by parentId)
    - react-hook-form + zodResolver for category CRUD dialogs with auto-slug generation
    - Debounced search (300ms) with useRef setTimeout for URL updates
    - "use server" actions with requireAdmin() guard pattern

key-files:
  created:
    - src/features/admin/schemas/category-schemas.ts
    - src/features/admin/actions/category-actions.ts
    - src/features/admin/components/ServiceActionsDropdown.tsx
    - src/features/admin/components/ServicesDataTable.tsx
    - src/app/[locale]/(admin)/admin/services/page.tsx
    - src/features/admin/components/CategoryDialog.tsx
    - src/features/admin/components/CategoryTreeView.tsx
  modified:
    - src/features/admin/actions/admin-actions.ts (added toggleFeaturedAction)
    - src/components/layout/AdminSidebar.tsx (added Services nav item)
    - src/app/[locale]/(admin)/admin/categories/page.tsx (rewritten with CategoryTreeView)

key-decisions:
  - "CategoryTreeView builds tree client-side from flat array — single DB query, tree structure handled in JavaScript via parentId grouping"
  - "CategoryDialog uses UpdateCategoryInput type for both create/edit — avoids union type resolver incompatibility with react-hook-form, id field destructured out on create"
  - "slugify() is inline utility in CategoryDialog — auto-generates from name in create mode only, editable in both modes"
  - "deleteCategoryAction checks services on both parent and children before soft-delete — returns descriptive error if blocked"
  - "toggleFeaturedAction added to admin-actions.ts (Rule 2 — missing critical functionality referenced in ServiceActionsDropdown)"

patterns-established:
  - "Admin data table pattern: server page reads URL searchParams, passes to client DataTable which owns filter/pagination via URL push"
  - "Admin tree view pattern: server page fetches flat array, client builds tree via buildTree() utility, each node is collapsible"
  - "Category CRUD: dialog-based with auto-slug, parent-child hierarchy support, service count guard on delete"

requirements-completed:
  - ADMN-02

duration: 45min
completed: "2026-02-26"
---

# Phase 10 Plan 03: Service & Category Management Summary

**Services paginated table with approve/suspend/featured actions + category tree view with CRUD dialogs, soft-delete cascade, and active toggle.**

## Performance

- **Duration:** ~45 min
- **Started:** 2026-02-26T15:01:43Z
- **Completed:** 2026-02-26T15:46:25Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments

- Services data table at /admin/services with search, status/category filters, pagination; PENDING_APPROVAL services show Approve action, ACTIVE services show Suspend action with AlertDialog + optional reason, all services have featured toggle
- Category management at /admin/categories with tree view rendering parent-children hierarchy, collapsible nodes (default expanded), active Switch toggle, edit/delete per node
- Category CRUD dialogs with react-hook-form + Zod validation: auto-slug from name in create mode, parent category select, sort order, active switch
- Soft-delete cascade: deleting a parent also soft-deletes children; blocks if category or children have active services
- AdminSidebar updated with Services nav item (Briefcase icon) before Categories

## Task Commits

1. **Task 1: Service management data table with approve/suspend/featured actions** - `7d7c3f9` (feat)
2. **Task 2: Category tree view with CRUD dialogs** - `c401c94` (feat — included in analytics assembly commit from concurrent plan 10-05 execution)

## Files Created/Modified

- `src/features/admin/schemas/category-schemas.ts` - createCategorySchema + updateCategorySchema with slug regex validation
- `src/features/admin/actions/category-actions.ts` - 5 CRUD server actions: getCategoriesTreeAction, createCategoryAction, updateCategoryAction, deleteCategoryAction (cascade + service guard), toggleCategoryActiveAction
- `src/features/admin/components/ServiceActionsDropdown.tsx` - DropdownMenu with approve/suspend (AlertDialog) and featured toggle actions
- `src/features/admin/components/ServicesDataTable.tsx` - 282-line data table with debounced search, status/category Select filters, pagination, mobile responsive columns
- `src/app/[locale]/(admin)/admin/services/page.tsx` - Server page reading searchParams, calling getAdminServicesAction + category fetch
- `src/features/admin/components/CategoryDialog.tsx` - react-hook-form dialog for create/edit with auto-slug, parent select, active switch
- `src/features/admin/components/CategoryTreeView.tsx` - 311-line tree view with client-side tree building, collapsible nodes, per-node CRUD actions
- `src/features/admin/actions/admin-actions.ts` - Added toggleFeaturedAction
- `src/components/layout/AdminSidebar.tsx` - Added Services nav item with Briefcase icon
- `src/app/[locale]/(admin)/admin/categories/page.tsx` - Rewritten as server component with CategoryTreeView

## Decisions Made

- CategoryDialog uses `UpdateCategoryInput` type for both create and edit modes to avoid union type incompatibility with react-hook-form's zodResolver. When creating, the `id` field is destructured out before calling `createCategoryAction`.
- Client-side tree building from a flat array: single DB query returns all categories, JavaScript groups by `parentId`. Avoids complex recursive Prisma query.
- `deleteCategoryAction` checks both the parent category and all children for active services before soft-deleting. Returns descriptive errors.
- `toggleFeaturedAction` added to `admin-actions.ts` as a missing critical action referenced by `ServiceActionsDropdown` (Rule 2 auto-fix).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added toggleFeaturedAction to admin-actions.ts**
- **Found during:** Task 1 (ServiceActionsDropdown implementation)
- **Issue:** Plan referenced `toggleFeaturedAction` in the ServiceActionsDropdown but this action didn't exist in admin-actions.ts
- **Fix:** Added `toggleFeaturedAction(serviceId)` that flips `isFeatured` boolean and returns new value
- **Files modified:** `src/features/admin/actions/admin-actions.ts`
- **Verification:** TypeScript passes, no import errors in ServiceActionsDropdown
- **Committed in:** 7d7c3f9 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 2 — missing critical functionality)
**Impact on plan:** Auto-fix essential for ServiceActionsDropdown to compile and work. No scope creep.

## Issues Encountered

- CategoryDialog resolver type mismatch: using union type `CreateCategoryInput | UpdateCategoryInput` for react-hook-form's zodResolver caused TypeScript errors. Fixed by using `UpdateCategoryInput` as the single form type and casting the resolver.
- TypeScript check: 4 pre-existing errors from prior plans (analytics page AnalyticsPageClient missing, recharts Formatter type strictness in 3 chart files). None from plan 10-03 files.
- Plan 10-05 ran concurrently and committed category files in its own commit (`c401c94`). Task 2 files were already present when Task 2 commit was attempted.

## Next Phase Readiness

- Services management page fully operational at /admin/services
- Categories management fully operational at /admin/categories
- AdminSidebar now includes Services link for navigation
- All admin CRUD actions enforce ADMIN role via `requireAdmin()` helper
- Ready for plan 10-04 (Reports management) or plan 10-05 (Analytics)

---
*Phase: 10-panneau-administration*
*Completed: 2026-02-26*
