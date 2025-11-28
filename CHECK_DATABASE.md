# Database Check

Please run these SQL queries in Supabase SQL Editor to check the database state:

## 1. Check if custom_music_uploads table exists:

```sql
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name = 'custom_music_uploads'
);
```

**Expected result:** `true`

---

## 2. Check if user_settings has new columns:

```sql
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'user_settings'
AND column_name IN ('selected_custom_music_id', 'music_license_accepted', 'music_license_accepted_at');
```

**Expected result:** 3 rows showing those column names

---

## 3. Check if voice_presets has voice_type column:

```sql
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'voice_presets'
AND column_name = 'voice_type';
```

**Expected result:** 1 row

---

## 4. Check how many voice presets exist:

```sql
SELECT COUNT(*) FROM voice_presets;
```

**Expected result:** Should be > 0 (ideally 100+ after running voice generator)
**If 0:** You need to run the voice preview generator script

---

## 5. Check if your user has settings row:

```sql
SELECT * FROM user_settings WHERE user_id = auth.uid();
```

**Expected result:** Should show your settings row
**If empty:** The row will be created automatically on first save

---

## 6. Test get_user_music_preference function:

```sql
SELECT * FROM get_user_music_preference(auth.uid());
```

**Expected result:** Should return a row with music preferences

---

## If any checks fail:

### Run the migration:
1. Go to: https://supabase.com/dashboard/project/nhbsvtcuehbttqtcgpoc/sql
2. Copy contents of: `supabase/migrations/20250124000002_update_customization_tables.sql`
3. Paste and click "Run"

### Populate voice presets:
```bash
npx tsx scripts/generate-voice-previews.ts
```

This will take 5-10 minutes and populate 100+ Serbian voices.
