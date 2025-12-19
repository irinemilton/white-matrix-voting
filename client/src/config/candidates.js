// Additional candidate details (frontend only)
// LinkedIn URLs come from database, rest is configured here
export const candidateDetails = {
  // Map candidate IDs to additional frontend details
  // These will be merged with database data
  1: {
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
    tagline: 'Innovation • Leadership • Growth',
    experience: '10+ years in leadership roles',
    keyPoints: [
      'Proven track record in strategic planning',
      'Strong advocate for team development',
      'Committed to transparent communication'
    ],
    color: '#3b82f6' // Blue theme
  },
  2: {
    photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
    tagline: 'Excellence • Impact • Community',
    experience: '8+ years driving positive change',
    keyPoints: [
      'Focus on measurable results',
      'Passionate about community engagement',
      'Dedicated to continuous improvement'
    ],
    color: '#10b981' // Green theme
  }
};

// Default fallback for candidates not in config
export const defaultCandidateDetails = {
  photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop',
  tagline: 'Dedicated Professional',
  experience: 'Experienced leader',
  keyPoints: [
    'Committed to excellence',
    'Focused on results',
    'Dedicated to service'
  ],
  color: '#64748b' // Gray theme
};

