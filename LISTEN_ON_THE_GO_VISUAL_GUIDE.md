# Listen on the Go - Visual Guide

## Feature Overview

The "Listen on the Go" feature provides an audio-only option for students who want to consume lesson content without watching the video. It appears as a collapsible section directly under the video player.

## User Interface

### State 1: Collapsed (Default)

When a lesson page loads, students see the video player with a small button below it:

```
┌─────────────────────────────────────────┐
│                                         │
│           VIDEO PLAYER                  │
│                                         │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  🎧  Prefer audio only?                 │
│      Listen on the Go               ⌄  │
└─────────────────────────────────────────┘
```

**Visual Details:**
- Golden headphone icon on the left
- Two-line text: Main question + feature name
- Chevron down icon on the right
- Subtle hover effect (background and border change)
- Full width on mobile, auto-width on desktop

### State 2: Expanded

When clicked, the button expands to show the full audio player:

```
┌─────────────────────────────────────────┐
│  🎧  Listen on the Go                  ⌃│
│      Same lesson, lighter format        │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  🎧  Part 1: The Pre-Islamic...    1x 🔊│
│                                         │
│  ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬○──────      │
│  2:34                          15:22    │
│                                         │
│      -15s    ▶️ PLAY    +15s            │
│                                         │
└─────────────────────────────────────────┘

Same lesson, lighter and easier to review
when you do not want to watch the screen.
```

**Visual Details:**
- Header with title and collapse button
- Compact audio player with golden accent colors
- Playback speed control (dropdown menu)
- Volume/mute toggle
- Interactive progress bar
- Large play/pause button (golden circle)
- Skip buttons with -15s/+15s labels
- Helpful description text below
- Smooth fade-in animation

## Component Hierarchy

```
Lesson Page
└── PartTabs (Watch mode)
    ├── VideoPlayer
    └── ListenOnTheGo (shows only if audio available)
        └── AudioPlayer (compact mode)
```

## Playback Speed Menu

When the user clicks the speed indicator (e.g., "1x"), a dropdown appears:

```
┌──────┐
│ 0.75x│
│  1x  │ ← highlighted if selected
│ 1.25x│
│ 1.5x │
│ 1.75x│
│  2x  │
└──────┘
```

**Visual Details:**
- Floating dropdown menu
- Current speed highlighted in gold
- Smooth transitions
- Closes when clicking outside

## Responsive Behavior

### Desktop (≥640px)
- Trigger button: Auto-width, sits naturally under video
- Audio player: Full features visible
- Speed menu: Dropdown on right side
- Touch targets: Standard size

### Mobile (<640px)
- Trigger button: Full width for easy tapping
- Audio player: Compact layout, larger touch targets
- Speed menu: Covers less screen space
- All controls remain accessible

## Color Palette

The feature uses the site's existing design system:

- **Primary Gold**: `#C8A96E` - Play button, progress bar, icons
- **Surface**: `#111118` - Background
- **Surface Raised**: `#16161F` - Elevated elements
- **Border**: `#1E1E2C` - Subtle dividers
- **Text**: `#F0EBE3` - Primary text
- **Text Muted**: `#5C5C70` - Secondary text

## Animations

1. **Expand**: Smooth fade-in with slight upward slide (0.2s)
2. **Button Hover**: Background and border color transition
3. **Icon Hover**: Slight color intensification
4. **Progress Bar**: Dot appears on hover

## Accessibility

- ✅ Keyboard navigable (Tab, Enter, Space)
- ✅ ARIA labels on buttons ("Playback speed", "Back 15s", etc.)
- ✅ Semantic HTML structure
- ✅ Sufficient color contrast
- ✅ Touch targets ≥44px (mobile)
- ✅ Focus indicators visible

## Edge Cases Handled

### No Audio Available
- Component doesn't render at all
- No empty state or placeholder
- Video player appears normally without clutter

### Audio Loading
- Standard browser loading behavior
- "Loading" implied by disabled controls
- Metadata loads quickly (preload="metadata")

### Playback Errors
- Browser's native error handling
- User can see standard audio error message
- Doesn't break page layout

### Very Long Audio
- Progress bar scales appropriately
- Time display handles hours (e.g., "1:23:45")
- Seeking works across entire duration

### Very Short Audio
- All controls remain functional
- Progress bar still works smoothly
- Time display shows seconds correctly

## Browser Compatibility

| Feature | Support |
|---------|---------|
| HTML5 Audio | ✅ All modern browsers |
| MP3 Codec | ✅ Universal support |
| Playback Rate API | ✅ Chrome, Firefox, Safari, Edge |
| Flexbox Layout | ✅ All modern browsers |
| CSS Animations | ✅ All modern browsers |

**Minimum Versions:**
- Chrome 50+
- Firefox 50+
- Safari 11+
- Edge 79+
- iOS Safari 11+
- Chrome Android 50+

## User Experience Flow

### First Time User
1. User arrives at lesson page
2. Sees video player prominently
3. Notices subtle "Listen on the Go" option below
4. Curious, clicks to explore
5. Discovers audio player with controls
6. Can listen while doing other tasks

### Returning User
1. User who prefers audio can quickly expand
2. Playback speed preference remembered (browser state)
3. Can collapse back to video if desired
4. Seamless switching between video and audio

## Marketing/Educational Notes

### What to Emphasize
✅ Convenience feature for busy students
✅ Same content, different format
✅ Perfect for:
   - Commuting
   - Exercising
   - Reviewing material
   - Low-bandwidth situations
   - Battery conservation

### What NOT to Say
❌ Not "premium audio content"
❌ Not "enhanced audio version"
❌ Not "exclusive to Complete users"
❌ Not a "separate lesson"

**Key Message:** "Same lesson, just easier to listen to when you're on the move."

## Implementation Benefits

1. **Non-Intrusive**: Doesn't clutter the main interface
2. **Discoverable**: Clear CTA helps users find it
3. **Flexible**: Easy to update or enhance
4. **Performant**: Only loads when needed
5. **Maintainable**: Clean, well-documented code
6. **Accessible**: Works for all students
7. **Mobile-First**: Optimized for phones and tablets
8. **Future-Proof**: Ready for enhancements

## Future Enhancement Ideas

These are NOT currently implemented but could be added later:

- **Remember State**: Persist expanded/collapsed per user
- **Auto-Resume**: Continue from last position
- **Download**: Offline listening option
- **Sleep Timer**: Auto-pause after duration
- **Chapters**: Jump to specific sections
- **Transcript Sync**: Highlight current text
- **Background Play**: Continue when tab inactive
- **Playlist Mode**: Queue multiple lessons

## Testing Scenarios

✅ **Visual Testing**
- [ ] Appears correctly on desktop
- [ ] Appears correctly on mobile
- [ ] Animations are smooth
- [ ] Colors match design system

✅ **Functional Testing**
- [ ] Expands/collapses correctly
- [ ] Play/pause works
- [ ] Skip buttons work
- [ ] Speed control works
- [ ] Progress bar seeks correctly
- [ ] Volume/mute works

✅ **Edge Case Testing**
- [ ] Works without audio (doesn't show)
- [ ] Works with slow connection
- [ ] Works with very long audio
- [ ] Works with very short audio
- [ ] Speed menu closes on outside click

✅ **Cross-Browser Testing**
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (Desktop)
- [ ] Safari (iOS)
- [ ] Chrome (Android)

## Summary

The "Listen on the Go" feature provides a polished, user-friendly way for students to consume lesson audio. It's positioned as a convenience feature (not premium content), integrates seamlessly with the existing UI, and follows best practices for accessibility and responsive design.
