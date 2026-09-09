# Git-First Design Revert

When the user asks to "undo", "revert", "go back to original", or reset design changes:

1. Run `git restore .` to discard all working-tree changes to tracked files.
2. Run `git clean -fd` to remove untracked files created during the design iteration.
3. Verify the restore with `git status` (should show "working tree clean").
4. Run `npm run typecheck` and `npm run build` to confirm the original codebase compiles.
5. Only THEN begin new work.

Never manually revert individual files when a full git restore is cleaner.
