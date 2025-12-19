# Candidate Information Enhancements

## ✅ What Was Added

### Database Changes
- Added `linkedin_url` column to `candidates` table
- LinkedIn URLs are stored in the database and fetched via API
- Sample candidates now include LinkedIn URLs

### Frontend Enhancements
- **Rich candidate cards** with:
  - Profile photos (from Unsplash, configurable)
  - Taglines and experience summaries
  - Key highlights/points
  - LinkedIn profile links (from database)
  - Color-coded themes per candidate
  - Enhanced hover effects and styling

### Configuration
- Frontend candidate details stored in `client/src/config/candidates.js`
- Easy to customize photos, taglines, key points, and colors
- LinkedIn URLs come from database, rest is frontend config

## 🚀 Setup Instructions

### 1. Update Database Schema
Run the migration to add LinkedIn URL column:
```bash
cd server
npm run migrate
```

Or run setup to recreate tables with new schema:
```bash
npm run setup
```

### 2. Update Candidate LinkedIn URLs
Edit the LinkedIn URLs in your database or update `server/setup.js` with real LinkedIn URLs:

```sql
UPDATE candidates SET linkedin_url = 'https://www.linkedin.com/in/real-profile' WHERE id = 1;
```

### 3. Customize Frontend Details
Edit `client/src/config/candidates.js` to customize:
- Profile photos (use any image URL)
- Taglines
- Experience descriptions
- Key points/highlights
- Color themes

Example:
```javascript
1: {
  photo: 'https://your-image-url.com/photo.jpg',
  tagline: 'Your Custom Tagline',
  experience: 'Your Experience',
  keyPoints: [
    'Point 1',
    'Point 2',
    'Point 3'
  ],
  color: '#3b82f6' // Hex color code
}
```

## 📋 Candidate Data Structure

### Database Fields (from API):
- `id` - Candidate ID
- `name` - Candidate name
- `description` - Bio/description
- `linkedin_url` - LinkedIn profile URL (from database)

### Frontend Config Fields:
- `photo` - Profile photo URL
- `tagline` - Short tagline
- `experience` - Experience summary
- `keyPoints` - Array of key highlights
- `color` - Theme color (hex code)

## 🎨 Features

### Enhanced Candidate Cards
- **Professional layout** with photo, name, and tagline at top
- **Detailed bio** from database
- **Key highlights** section with checkmarks
- **LinkedIn link** button with icon
- **Color-coded** borders and buttons
- **Hover effects** for better UX
- **Responsive design** works on all screen sizes

### Visual Improvements
- Circular profile photos
- Color-coded themes per candidate
- Clean, modern card design
- Professional typography
- Smooth animations and transitions

## 🔧 Customization Guide

### Adding a New Candidate

1. **Add to database**:
```sql
INSERT INTO candidates (name, description, linkedin_url) 
VALUES ('New Candidate', 'Description here', 'https://linkedin.com/in/new-candidate');
```

2. **Add frontend config** in `client/src/config/candidates.js`:
```javascript
3: {
  photo: 'https://images.unsplash.com/photo-...',
  tagline: 'Tagline here',
  experience: 'Experience here',
  keyPoints: ['Point 1', 'Point 2'],
  color: '#8b5cf6'
}
```

### Changing Candidate Photos
Replace the `photo` URL in `candidates.js` with:
- Unsplash URLs: `https://images.unsplash.com/photo-...`
- Your own hosted images
- Placeholder services: `https://via.placeholder.com/400`

### Updating LinkedIn URLs
Update directly in database:
```sql
UPDATE candidates SET linkedin_url = 'new-url' WHERE id = 1;
```

Or update `setup.js` and rerun setup.

## 📝 Notes

- LinkedIn URLs are **required from database** - they're fetched via API
- All other details (photos, taglines, etc.) are **frontend-only** config
- If a candidate ID isn't in the config, default values are used
- Photos have fallback to placeholder if image fails to load
- All styling is responsive and mobile-friendly

