# Deferred Items — Phase 08-avis-evaluations

## TypeScript Error in ReviewForm.tsx (Pre-existing from Plan 08-02/03)

**File:** `src/features/review/components/ReviewForm.tsx`
**Discovered during:** Plan 08-04, Task 1 TypeScript verification
**Scope:** Pre-existing — NOT caused by 08-04 changes

### Error Details

```
TS2322: Type 'Resolver<...photoUrls?: string[] | undefined...>' is not assignable to
        type 'Resolver<...photoUrls: string[]...>'
```

**Root cause:** `reviewSubmitSchema` uses `.default([])` on the `photoUrls` field, which makes the Zod input type `photoUrls?: string[] | undefined`. The form's inferred TypeScript type (`ReviewSubmitInput`) therefore has `photoUrls` as optional, but react-hook-form requires the resolved default type (`string[]`).

**Fix:** Change `useForm<ReviewSubmitInput>` to `useForm<z.output<typeof reviewSubmitSchema>>` or add an explicit default in the form config that forces `string[]`. Alternatively, adjust the schema to use `z.array(...).optional().default([])` with a proper type assertion.

**Impact:** Build fails TypeScript check until fixed. UI form may still work at runtime due to the provided default value.

**Should be fixed in:** Plan 08-02 or 08-03 revisit.
