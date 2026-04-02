import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export function createClient() {
  return createSupabaseClient(
    'https://fggiqliqlqdijzmfglav.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZnZ2lxbGlxbHFkaWp6bWZnbGF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM1NTI5MzMsImV4cCI6MjA1OTEyODkzM30.Ex8fX3C-0_12BFTMGrJxDa7H7EFQClJ6sfj4EPnokHI'
  )
}
```

Press **Ctrl+S** then in Terminal:
```
git add .
git commit -m "hardcode supabase keys for testing"
git push