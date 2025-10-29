# Adding Teen Patti Table Image

## ✅ CSS Already Updated!

The CSS has been configured to use the table image. Now just add the image file:

---

## 📁 **Step-by-Step Instructions:**

### 1. Save Your Table Image
- Take the Teen Patti table image you provided
- Save it as: **`teen-patti-table.jpg`** or **`teen-patti-table.png`**

### 2. Place Image in Correct Location
Copy the image to:
```
teen-patti-react/
  client/
    public/
      images/
        teen-patti-table.jpg  ← PUT IMAGE HERE
```

The `images` folder already exists at: `client/public/images/`

### 3. Verify Image Path
Make sure the file path matches one of these:
- `client/public/images/teen-patti-table.jpg`
- `client/public/images/teen-patti-table.png`

If you use `.png` instead of `.jpg`, update the CSS file:
```css
/* In client/src/components/GameTable.css */
background-image: url('/images/teen-patti-table.png');
```

---

## 🎨 **What the CSS Does:**

The table now uses the actual image with these settings:

```css
.game-table {
  background-image: url('/images/teen-patti-table.jpg');
  background-size: cover;        /* Image fills entire table */
  background-position: center;   /* Centered */
  background-repeat: no-repeat;  /* No tiling */
  border-radius: 200px / 100px;  /* Oval shape */
  background-color: #B01919;     /* Fallback if image fails to load */
}
```

---

## ✅ **Features:**

- ✅ Full-size table image covering entire game area
- ✅ Oval border radius for authentic casino shape
- ✅ Centered and properly scaled
- ✅ Fallback red color if image doesn't load
- ✅ "TEEN PATTI" logo watermark still visible on top

---

## 🚀 **Test It:**

After adding the image:

1. Start the dev server:
   ```bash
   cd client
   npm run dev
   ```

2. Open the game in your browser
3. The table should display with the authentic image!

---

## 🔧 **Troubleshooting:**

### Image Not Showing?

**Check 1:** Verify file exists at `client/public/images/teen-patti-table.jpg`

**Check 2:** Try different image path in CSS:
```css
/* Try with leading slash */
background-image: url('/images/teen-patti-table.jpg');

/* OR without leading slash */
background-image: url('images/teen-patti-table.jpg');
```

**Check 3:** Check browser console (F12) for image loading errors

**Check 4:** Clear browser cache (Ctrl+Shift+R) and reload

**Check 5:** Verify image file extension matches CSS (`.jpg` vs `.png`)

---

## 📝 **Alternative: Use PNG Format**

If your image is PNG format:

1. Save as `teen-patti-table.png`
2. Update CSS:
```css
background-image: url('/images/teen-patti-table.png');
```

---

## 🎯 **Result:**

Once the image is added, your game table will display the authentic Teen Patti casino table exactly like the reference image you provided, complete with:
- Red felt surface
- Gold border trim
- Dark wood edges
- Professional casino appearance

The "TEEN PATTI" watermark will appear on top of the image for branding.
