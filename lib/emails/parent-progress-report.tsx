interface ProgressReportData {
  studentName: string;
  parentName: string;
  userPlan: "essentials" | "complete";
  
  // Overall stats
  lessonsWatched: number;
  totalLessons: number;
  briefingsRead: number;
  studyTimeHours: number;
  currentLesson: {
    number: number;
    title: string;
    status: "not_started" | "in_progress" | "completed";
  };
  suggestedNextLesson: {
    number: number;
    title: string;
  };
  
  // Weekly activity (for grading)
  weeklyLessons: number;
  weeklyBriefings: number;
  weeklyQuizzes?: number;
  weeklyFlashcards?: number;
  weeklyStudyTime: number;
  hasWeeklyActivity: boolean;
  
  // Complete-only stats
  quizScore?: number;
  quizAttempts?: number;
  flashcardsReviewed?: number;
  weakAreas?: string[];
  strongAreas?: string[];
  recommendedReview?: string[];
  certificateProgress?: number;
}

// Calculate weekly grade
function calculateWeeklyGrade(data: ProgressReportData): { grade: string; status: string; color: string } {
  const { userPlan, weeklyLessons, weeklyBriefings, weeklyQuizzes = 0, weeklyFlashcards = 0, hasWeeklyActivity } = data;
  
  if (!hasWeeklyActivity) {
    return { grade: "F", status: "No meaningful activity", color: "#ef4444" };
  }
  
  if (userPlan === "essentials") {
    if (weeklyLessons >= 3 && weeklyBriefings >= 3) {
      return { grade: "A", status: "Excellent progress", color: "#22c55e" };
    }
    if (weeklyLessons >= 2 && weeklyBriefings >= 1) {
      return { grade: "B", status: "Good progress", color: "#3b82f6" };
    }
    if (weeklyLessons >= 1 || weeklyBriefings >= 1) {
      return { grade: "C", status: "Needs consistency", color: "#f59e0b" };
    }
    return { grade: "D", status: "Falling behind", color: "#f97316" };
  } else {
    // Complete users
    if (weeklyLessons >= 2 && weeklyQuizzes >= 2 && weeklyFlashcards > 0) {
      return { grade: "A", status: "Excellent progress", color: "#22c55e" };
    }
    if (weeklyLessons >= 2 && weeklyQuizzes >= 1) {
      return { grade: "B", status: "Good progress", color: "#3b82f6" };
    }
    if (weeklyLessons >= 1) {
      return { grade: "C", status: "Needs consistency", color: "#f59e0b" };
    }
    return { grade: "D", status: "Falling behind", color: "#f97316" };
  }
}

export function generateParentProgressReport(data: ProgressReportData): string {
  const progressPercent = Math.round((data.lessonsWatched / data.totalLessons) * 100);
  const isComplete = data.userPlan === "complete";
  const weeklyGrade = calculateWeeklyGrade(data);
  
  // Greeting logic
  const greeting = data.parentName && data.parentName !== "Parent" 
    ? `As-salamu alaykum ${data.parentName},` 
    : "As-salamu alaykum,";
  
  // Progress display
  const progressDisplay = progressPercent === 0 
    ? "Just getting started" 
    : `${progressPercent}% complete • ${data.lessonsWatched} of ${data.totalLessons} lessons`;
  
  // Current lesson status
  const lessonStatusText = 
    data.currentLesson.status === "not_started" ? "Not Started" :
    data.currentLesson.status === "in_progress" ? "In Progress" :
    "Completed";
  
  // Next step recommendation
  const nextStepText = 
    data.lessonsWatched === 0 
      ? `Start Part ${data.suggestedNextLesson.number}: ${data.suggestedNextLesson.title}` 
      : data.currentLesson.status === "completed"
      ? `Start Part ${data.suggestedNextLesson.number}: ${data.suggestedNextLesson.title}`
      : `Continue Part ${data.currentLesson.number}: ${data.currentLesson.title}`;
  
  // Encouragement message
  const encouragementText = data.hasWeeklyActivity && weeklyGrade.grade !== "F"
    ? `<strong style="color: #f4c542;">Keep up the excellent work!</strong><br>
       ${data.studentName} is making wonderful progress in learning about the life of Prophet Muhammad ﷺ. 
       ${isComplete ? 'The mastery system is helping build deep understanding.' : 'Continue watching and listening to strengthen understanding.'}`
    : `<strong style="color: #f4c542;">Suggested focus for this week:</strong><br>
       Begin with the next lesson and read the briefing. Consistency is key to making meaningful progress.`;

  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${data.studentName}'s Weekly Seerah Progress Report</title>
  </head>
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8f9fa;">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); padding: 40px 20px; text-align: center; border-radius: 12px 12px 0 0;">
      <h1 style="color: #f4c542; margin: 0; font-size: 28px;">Seerah Progress Report</h1>
      <p style="color: #e5e5e5; margin: 10px 0 0 0; font-size: 16px;">${data.studentName}'s Weekly Update</p>
    </div>

    <!-- Main Content -->
    <div style="background: #ffffff; padding: 40px 30px; border-left: 1px solid #e5e5e5; border-right: 1px solid #e5e5e5;">
      <p style="font-size: 16px; margin: 0 0 20px 0;">${greeting}</p>
      
      <p style="font-size: 15px; margin: 0 0 30px 0; color: #555;">
        Here's a summary of ${data.studentName}'s progress in learning the life of Prophet Muhammad ﷺ.
      </p>

      <!-- Weekly Grade -->
      <div style="background: linear-gradient(135deg, ${weeklyGrade.color}15 0%, ${weeklyGrade.color}05 100%); border: 2px solid ${weeklyGrade.color}; padding: 25px; margin: 0 0 30px 0; border-radius: 12px; text-align: center;">
        <p style="margin: 0 0 15px 0; color: #666; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">
          This Week's Grade
        </p>
        <table cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto 15px auto;">
          <tr>
            <td style="width: 80px; height: 80px; background: ${weeklyGrade.color}; border-radius: 50%; text-align: center; vertical-align: middle;">
              <span style="color: white; font-size: 48px; font-weight: bold; line-height: 80px;">${weeklyGrade.grade}</span>
            </td>
          </tr>
        </table>
        <p style="margin: 0 0 10px 0; color: #1a1a1a; font-size: 18px; font-weight: 600;">
          ${weeklyGrade.status}
        </p>
        <p style="margin: 0; color: #666; font-size: 13px; line-height: 1.5;">
          This grade is based on this week's lesson activity, briefing progress, study time, and available review tools.
        </p>
      </div>

      <!-- At a Glance -->
      <h3 style="margin: 30px 0 15px 0; color: #1a1a1a; font-size: 18px;">📊 At a Glance</h3>
      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid #e5e5e5;">
              <span style="color: #666; font-size: 14px;">📅 Lessons This Week</span>
            </td>
            <td style="padding: 10px 0; border-bottom: 1px solid #e5e5e5; text-align: right;">
              <strong style="color: #1a1a1a; font-size: 16px;">${data.weeklyLessons}</strong>
            </td>
          </tr>
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid #e5e5e5;">
              <span style="color: #666; font-size: 14px;">📄 Briefings This Week</span>
            </td>
            <td style="padding: 10px 0; border-bottom: 1px solid #e5e5e5; text-align: right;">
              <strong style="color: #1a1a1a; font-size: 16px;">${data.weeklyBriefings}</strong>
            </td>
          </tr>
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid #e5e5e5;">
              <span style="color: #666; font-size: 14px;">⏱️ Study Time This Week</span>
            </td>
            <td style="padding: 10px 0; border-bottom: 1px solid #e5e5e5; text-align: right;">
              <strong style="color: #1a1a1a; font-size: 16px;">${data.weeklyStudyTime}h</strong>
            </td>
          </tr>
          ${isComplete && data.weeklyQuizzes !== undefined ? `
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid #e5e5e5;">
              <span style="color: #666; font-size: 14px;">📝 Quizzes This Week</span>
            </td>
            <td style="padding: 10px 0; border-bottom: 1px solid #e5e5e5; text-align: right;">
              <strong style="color: #1a1a1a; font-size: 16px;">${data.weeklyQuizzes}</strong>
            </td>
          </tr>
          ` : ''}
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid #e5e5e5;">
              <span style="color: #666; font-size: 14px;">📖 Current Lesson</span>
            </td>
            <td style="padding: 10px 0; border-bottom: 1px solid #e5e5e5; text-align: right;">
              <strong style="color: #1a1a1a; font-size: 16px;">Part ${data.currentLesson.number}</strong>
            </td>
          </tr>
          <tr>
            <td style="padding: 10px 0;">
              <span style="color: #666; font-size: 14px;">🎯 Next Step</span>
            </td>
            <td style="padding: 10px 0; text-align: right;">
              <strong style="color: #f4c542; font-size: 14px;">${nextStepText.split(':')[0]}</strong>
            </td>
          </tr>
        </table>
      </div>

      <!-- Overall Progress -->
      <h3 style="margin: 30px 0 15px 0; color: #1a1a1a; font-size: 18px;">📈 Overall Course Progress</h3>
      <div style="background: #f8f9fa; border-left: 4px solid #f4c542; padding: 20px; margin: 0 0 25px 0; border-radius: 8px;">
        ${progressPercent > 0 ? `
        <div style="background: #e5e5e5; height: 24px; border-radius: 12px; overflow: hidden; margin: 0 0 12px 0;">
          <div style="background: linear-gradient(90deg, #f4c542 0%, #f4b542 100%); height: 100%; width: ${progressPercent}%; transition: width 0.3s;"></div>
        </div>
        ` : ''}
        <p style="margin: 0; font-size: 16px; color: #1a1a1a; font-weight: 600;">
          ${progressDisplay}
        </p>
        ${progressPercent > 0 ? `
        <p style="margin: 8px 0 0 0; font-size: 13px; color: #666;">
          Total study time: ${data.studyTimeHours} hours
        </p>
        ` : ''}
      </div>

      <!-- Current Learning -->
      <h3 style="margin: 30px 0 15px 0; color: #1a1a1a; font-size: 18px;">📚 Current Learning</h3>
      <div style="background: linear-gradient(135deg, #f4c542 0%, #f4b542 100%); padding: 25px; border-radius: 12px; margin-bottom: 25px;">
        <table cellpadding="0" cellspacing="0" border="0" style="width: 100%; margin-bottom: 10px;">
          <tr>
            <td style="vertical-align: top;">
              <p style="margin: 0; color: #1a1a1a; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                Part ${data.currentLesson.number}
              </p>
            </td>
            <td style="text-align: right; vertical-align: top;">
              <span style="background: rgba(0,0,0,0.15); padding: 4px 12px; border-radius: 20px; color: #1a1a1a; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; white-space: nowrap;">
                ${lessonStatusText}
              </span>
            </td>
          </tr>
        </table>
        <p style="margin: 0; color: #1a1a1a; font-size: 18px; font-weight: 600; line-height: 1.4;">
          ${data.currentLesson.title}
        </p>
      </div>

      ${isComplete && data.strongAreas && data.strongAreas.length > 0 ? `
      <h3 style="margin: 30px 0 15px 0; color: #1a1a1a; font-size: 18px;">💪 Areas of Strength</h3>
      <div style="background: #f0fdf4; border-left: 4px solid #22c55e; padding: 15px 20px; border-radius: 8px; margin-bottom: 20px;">
        <ul style="margin: 0; padding: 0 0 0 20px; color: #166534;">
          ${data.strongAreas.map(area => `<li style="margin: 5px 0;">${area}</li>`).join('')}
        </ul>
      </div>
      ` : ''}

      ${isComplete && data.weakAreas && data.weakAreas.length > 0 ? `
      <h3 style="margin: 30px 0 15px 0; color: #1a1a1a; font-size: 18px;">🎯 Areas for Growth</h3>
      <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px 20px; border-radius: 8px; margin-bottom: 20px;">
        <ul style="margin: 0; padding: 0 0 0 20px; color: #92400e;">
          ${data.weakAreas.map(area => `<li style="margin: 5px 0;">${area}</li>`).join('')}
        </ul>
      </div>
      ` : ''}

      <!-- Recommended Next Step -->
      <h3 style="margin: 30px 0 15px 0; color: #1a1a1a; font-size: 18px;">🎯 Recommended Next Step</h3>
      <div style="background: #f8f9fa; border: 2px solid #e5e5e5; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
        <p style="margin: 0; color: #1a1a1a; font-size: 16px; font-weight: 600;">
          ${nextStepText}
        </p>
      </div>

      ${isComplete && data.quizScore !== undefined ? `
      <!-- Performance Stats (Complete only) -->
      <h3 style="margin: 30px 0 15px 0; color: #1a1a1a; font-size: 18px;">📊 Performance Stats</h3>
      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid #e5e5e5;">
              <span style="color: #666; font-size: 14px;">Average Quiz Score</span>
            </td>
            <td style="padding: 10px 0; border-bottom: 1px solid #e5e5e5; text-align: right;">
              <strong style="color: #f4c542; font-size: 16px;">${data.quizScore}%</strong>
            </td>
          </tr>
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid #e5e5e5;">
              <span style="color: #666; font-size: 14px;">Quizzes Completed</span>
            </td>
            <td style="padding: 10px 0; border-bottom: 1px solid #e5e5e5; text-align: right;">
              <strong style="color: #1a1a1a; font-size: 16px;">${data.quizAttempts}</strong>
            </td>
          </tr>
          ${data.flashcardsReviewed ? `
          <tr>
            <td style="padding: 10px 0;">
              <span style="color: #666; font-size: 14px;">Flashcards Reviewed</span>
            </td>
            <td style="padding: 10px 0; text-align: right;">
              <strong style="color: #1a1a1a; font-size: 16px;">${data.flashcardsReviewed}</strong>
            </td>
          </tr>
          ` : ''}
        </table>
      </div>
      ` : ''}

      <!-- Encouragement -->
      <div style="background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%); padding: 25px; border-radius: 8px; border: 2px solid #f4c542; margin: 30px 0;">
        <p style="margin: 0; color: #1a1a1a; font-size: 15px; text-align: center; line-height: 1.7;">
          ${encouragementText}
        </p>
      </div>

      <p style="margin: 20px 0 0 0; color: #999; font-size: 13px; text-align: center;">
        Questions or feedback? Feel free to reach out to our support team.
      </p>
    </div>

    <!-- Footer -->
    <div style="background: #f8f9fa; padding: 30px; text-align: center; border-radius: 0 0 12px 12px; border: 1px solid #e5e5e5; border-top: none;">
      <p style="font-size: 13px; color: #999; margin: 0;">
        © ${new Date().getFullYear()} Seerah LMS · TheMuslimMan
      </p>
      <p style="font-size: 12px; color: #999; margin: 10px 0 0 0;">
        You're receiving this because weekly progress reports are enabled for ${data.studentName}.
      </p>
    </div>

  </body>
</html>
  `;
}
