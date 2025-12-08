# How to Add Template Fields - Step-by-Step Guide

## Visual Navigation Guide

### Step 1: Go to OPD Settings → General Tab
```
Navigate to: /opd/settings/general
```

You should see a page with **Template Groups** table.

---

### Step 2: Click "View Templates" on a Group

In the Template Groups table, each row has action buttons. Look for:
- **Desktop**: A "..." (three dots) menu button on the right
  - Click it and select **"View Templates"**

OR

- **Mobile**: Direct button showing **"View Templates"**

This opens a **side drawer** showing all templates in that group.

---

### Step 3: Open Template Designer

In the Templates drawer (side panel), you'll see a list of templates.

For each template row, there are action buttons:

**Desktop (Actions Dropdown):**
1. Click the **"..."** (three dots) menu on the right of any template row
2. Select **"Design Template"** from the dropdown menu

**Mobile (Direct Buttons):**
1. Look for the **"Design"** button with a wrench icon (🔧)
2. Click it directly

This opens the **Template Designer** drawer.

---

### Step 4: Add a Field

In the Template Designer drawer, you'll see:

1. **Top Section**: Template Information card
2. **Middle Section**: "Template Fields" card with:
   - **Header area** containing:
     - "Template Fields" title
     - **"Refresh"** button (outline style)
     - **"Add Field"** button (primary blue button with a "+" icon) ← **THIS IS THE BUTTON YOU NEED!**

**If no fields exist yet:**
- You'll see an empty state message: "No fields yet"
- A centered **"Add First Field"** button with a "+" icon

Click **either** of these buttons to open the Field Editor.

---

### Step 5: Create Your Field

In the Field Editor drawer that opens:

1. **Field Configuration Section:**
   - **Field Label** * (required): Enter "Patient Name", "Blood Pressure", etc.
   - **Field Key** * (auto-generated): Will be auto-filled like "patient_name", "blood_pressure"
   - **Field Type** * (dropdown): Select from:
     - Text
     - Text Area
     - Number
     - Email
     - Phone
     - URL
     - Date
     - Date & Time
     - Checkbox
     - Dropdown (requires options)
     - Radio (requires options)
     - Multi-Select (requires options)
   - **Placeholder**: Optional placeholder text
   - **Help Text**: Optional help text
   - **Display Order**: Number for sorting
   - **Required Field**: Toggle switch
   - **Active**: Toggle switch

2. **Field Options Section** (only for Dropdown/Radio/Multi-Select):
   - Enter option text in input box
   - Click **"Add"** button or press Enter
   - Options will appear in a list
   - Click **X** to remove an option

3. **Validation Rules Section** (for text/number fields):
   - **For text fields**: Min Length, Max Length
   - **For number fields**: Min Value, Max Value

4. **Footer Buttons:**
   - **Cancel**: Close without saving
   - **Create**: Save the new field (or "Save" if editing)

Click **"Create"** to save your field!

---

## Complete Flow Diagram

```
OPD Settings (General Tab)
  ↓
Template Groups Table
  ↓ (Click "..." menu → "View Templates")
  ↓
Templates Drawer (side panel opens)
  ↓ (Click "..." menu → "Design Template")
  ↓
Template Designer Drawer (side panel opens)
  ↓ (Click "Add Field" button in header)
  ↓
Field Editor Drawer (side panel opens)
  ↓
Fill in field details
  ↓
Click "Create"
  ↓
✅ Field added successfully!
```

---

## Quick Reference

| Location | Button Name | Icon | Action |
|----------|-------------|------|--------|
| Template Groups Table | "View Templates" | - | Opens Templates list |
| Templates List (Desktop) | "..." → "Design Template" | 🔧 | Opens Designer |
| Templates List (Mobile) | "Design" | 🔧 | Opens Designer |
| Template Designer | "Add Field" | + | Opens Field Editor |
| Template Designer (empty) | "Add First Field" | + | Opens Field Editor |

---

## Troubleshooting

### "I don't see the 'View Templates' option"
- Make sure you're on the **General** tab in OPD Settings
- Check if you have any template groups created
- Look for the **"..."** (three dots) action menu on each row

### "I don't see the 'Design Template' option"
- Make sure you clicked "View Templates" first
- The Templates drawer should be open on the right side
- Look for the **"..."** (three dots) menu on each template row
- On mobile, look for the "Design" button directly

### "I don't see the 'Add Field' button"
- Make sure you clicked "Design Template" first
- The Template Designer drawer should be open
- Scroll down past the "Template Information" card
- Look in the "Template Fields" card header
- The button is blue with a "+" icon and says "Add Field"

### "I can't find any templates"
1. First, create a Template Group (if none exist)
2. Then create a Template in that group
3. Then you can design fields for that template

---

## Example: Creating a "Blood Pressure" Field

1. Navigate: OPD Settings → General Tab
2. Click "View Templates" on "Vitals" group
3. Click "..." → "Design Template" on "Patient Vitals" template
4. Click **"Add Field"** button
5. Fill in:
   - Field Label: `Blood Pressure`
   - Field Key: `blood_pressure` (auto-filled)
   - Field Type: `Text`
   - Placeholder: `120/80`
   - Required: ✅ ON
6. Click **"Create"**
7. ✅ Done!

---

## Screenshots Locations

**Button locations in the UI:**

1. **OPD Settings → General Tab**
   - Path: `/opd/settings/general`
   - Component: `GeneralSettingsTab.tsx`

2. **"View Templates" button**
   - Location: In each template group row
   - Component: `GeneralSettingsTab.tsx` (DataTable extraActions)

3. **"Design Template" menu item**
   - Location: Template row actions dropdown (Desktop) or direct button (Mobile)
   - Component: `TemplateListDrawer.tsx` lines 252-255 (Desktop), 223-226 (Mobile)

4. **"Add Field" button**
   - Location: Template Designer → Template Fields card header
   - Component: `TemplateDesigner.tsx` lines 331-334

5. **"Add First Field" button** (when empty)
   - Location: Template Designer → Empty state
   - Component: `TemplateDesigner.tsx` lines 343-347

---

## Need More Help?

If you still can't find the button:
1. Make sure you have created at least one Template Group
2. Make sure you have created at least one Template in that group
3. Ensure you have the HMS module access
4. Check the browser console for any errors
5. Try refreshing the page

The "Add Field" button is in the Template Designer, which is accessed through:
**Template Groups → View Templates → Design Template → Add Field**
