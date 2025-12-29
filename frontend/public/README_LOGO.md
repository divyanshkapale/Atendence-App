# College Logo Instructions

## Adding Your College Logo

To add your college logo to the E-Attendance System:

1. **Prepare your logo file:**
   - File name: `logo.png`
   - Recommended size: 200x200 pixels or larger (square format works best)
   - Supported formats: PNG (preferred), JPG, SVG
   - Background: Transparent PNG works best

2. **Add the logo file:**
   - Place your `logo.png` file in the `/public/` directory
   - Replace the current placeholder file

3. **File location:**
   ```
   single-server/
   └── public/
       ├── logo.png  ← Your college logo goes here
       ├── logo.svg  ← Fallback logo (can be replaced)
       └── index.html
   ```

4. **Current fallback:**
   - If `logo.png` is not found, the system will show `logo.svg`
   - The SVG is a generic education-themed placeholder
   - Replace both files with your college branding

## Current College Information

The header currently displays:
- **College Name:** Government Pench Valley PG College, Parasia
- **Department:** Department of Botany
- **System Title:** E-Attendance System

To change this information, edit the HTML in `public/index.html` around line 290.

## Logo Specifications

- **Desktop size:** 80x80px display size
- **Mobile size:** 60x60px display size
- **Format:** PNG with transparent background recommended
- **Fallback:** SVG logo will show if PNG is not available 