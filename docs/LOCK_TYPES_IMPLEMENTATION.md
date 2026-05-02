# Lock Types Implementation - Student Dashboard

## Summary
Implemented two distinct lock types for the student dashboard to differentiate between progress-based locks and plan-based locks.

## Lock Types

### 1. Progress Locked
**Definition**: The lesson is included in the student's current plan, but the student must complete the previous required lesson first.

**UI Behavior**:
- Shows lock icon (🔒)
- Message: `"🔒 Complete Part {previousPartNumber} to unlock"`
- Example: "🔒 Complete Part 7 to unlock"
- Styling: Muted colors (zinc-600) but not upsell language
- Not clickable

**When Applied**:
- Essentials users: Lessons 2-56 are progress-locked until the previous Essentials lesson is completed
- Complete users: All 100 lessons may be progress-locked if using guided progression

### 2. Plan Locked
**Definition**: The lesson or asset is NOT included in the student's current plan and requires Complete Seerah.

**UI Behavior**:
- Shows lock icon (🔒)
- Primary message: `"Complete Seerah Only"` (amber color)
- Helper text: `"Unlock Complete Seerah to access this lesson"`
- Styling: Uses amber accent colors for conversion
- Not clickable

**When Applied**:
- Essentials users: 44 lessons (Parts 3, 4, 5, 8, 10, 18, etc.) that are NOT included in Essentials
- Complete users: No plan-locked lessons (all content available)

## Implementation Details

### Status Function
```typescript
const getPartStatus = (partNumber: number) => {
  const part = PARTS.find(p => p.partNumber === partNumber);
  const isIncludedInPlan = userPlan === "complete" || part?.includedInEssentials;

  if (completedParts.includes(partNumber)) return "completed";
  if (inProgressParts.includes(partNumber)) return "in_progress";
  
  // Not included in user's plan - plan locked
  if (!isIncludedInPlan) return "plan_locked";
  
  // Included in plan but need to complete previous lesson - progress locked
  if (partNumber === currentPart + 1) return "next";
  if (partNumber > currentPart + 1) return "progress_locked";
  
  return "available";
};
```

### Previous Required Part Function
```typescript
const getPreviousRequiredPart = (partNumber: number) => {
  // Find the previous part that is included in the user's plan
  const allParts = PARTS.filter(p => {
    if (userPlan === "complete") return p.partNumber < partNumber;
    return p.includedInEssentials && p.partNumber < partNumber;
  });
  
  if (allParts.length === 0) return null;
  return allParts[allParts.length - 1].partNumber;
};
```

## Lesson States

1. **Completed**: Completion criteria met (green checkmark)
2. **In Progress**: Started but not completed (amber play icon, badge)
3. **Next**: Next sequential lesson available (blue badge)
4. **Available**: Included in plan and previous required lesson completed (play icon)
5. **Progress Locked**: Included in plan but previous required lesson not completed (lock icon, "Complete Part X" message)
6. **Plan Locked**: Not included in plan (lock icon, "Complete Seerah Only" message)

## Chapter Display

Chapters now show:
- **Included count**: Number of lessons in the user's plan
- **Locked count** (Essentials only): Number of plan-locked lessons for upsell
- **Completed count**: Number of included lessons completed
- **Percentage**: Progress on included lessons only

Example for Essentials user:
```
Pre-Islamic Arabia
5 lessons • 5 locked • 3 of 5 completed
60%
```

This means:
- 5 lessons included in Essentials plan
- 5 additional lessons locked (require Complete Seerah)
- 3 of the 5 Essentials lessons completed
- 60% progress on Essentials lessons in this chapter

## Course Progress Calculation

**Essentials Plan**:
- Counts only the 56 lessons included in Essentials
- Ignores the 44 plan-locked lessons
- Shows: "6 of 56 lessons completed" (12%)

**Complete Plan**:
- Counts all 100 lessons
- May show progress locks if guided progression is enabled
- Shows: "X of 100 lessons completed" (Y%)

## UI Examples

### Progress Locked Lesson
```
Part 9
Pre-Islamic Arabian Society
Tribes, Honor, and Custom
🔒 Complete Part 7 to unlock
```

### Plan Locked Lesson
```
Part 8
The Religious Landscape of Pre-Islamic Arabia
A Complex Tapestry of Belief

Complete Seerah Only
Unlock Complete Seerah to access this lesson
```

### Available Lesson
```
Part 7 (In Progress)
From Monotheism to Idolatry
How Arabia Lost the Faith of Ibrahim ﷺ
📹 Video · ✅ Quiz
```

## Benefits

### For Students:
- **Clear expectations**: Understand exactly why a lesson is locked
- **Motivation**: See progress toward unlocking the next lesson
- **Value awareness**: See what additional content is available in Complete Seerah
- **No confusion**: Different locks have different messaging

### For Conversion:
- **Upsell visibility**: Plan-locked lessons show what users are missing
- **Specific benefits**: "Complete Seerah Only" clearly labels premium content
- **No false promises**: Progress-locked lessons don't imply they're premium content
- **Strategic placement**: Plan-locked lessons appear throughout, reminding users of upgrade

## Technical Notes

1. **All parts are shown**: Even plan-locked parts are visible in the UI for upsell purposes
2. **Filtering happens at status level**: The `getPartStatus` function determines lock type
3. **Chapter counts are accurate**: Only included lessons count toward progress
4. **Sequential unlocking**: Progress locks ensure students follow the intended learning path
5. **No hydration errors**: Server-side rendering matches client-side rendering

## Future Enhancements

1. **Hover tooltips**: Add detailed tooltips explaining why a lesson is locked
2. **Unlock animations**: Celebrate when a lesson unlocks
3. **Smart previews**: Show snippets of plan-locked content to increase conversion
4. **Lock badges**: Visual indicators on chapter cards showing lock counts
5. **Custom unlock messages**: Personalized messages based on user progress
