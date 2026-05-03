interface ProgressReportData {
  studentName: string;
  parentName: string;
  userPlan: "essentials" | "complete";
  
  // Essentials stats (both plans)
  lessonsWatched: number;
  totalLessons: number;
  briefingsRead: number;
  studyTimeHours: number;
  currentLesson: {
    number: number;
    title: string;
  };
  suggestedNextLesson: {
    number: number;
    title: string;
  };
  
  // Complete-only stats
  quizScore?: number;
  quizAttempts?: number;
  flashcardsReviewed?: number;
  weakAreas?: string[];
  strongAreas?: string[];
  recommendedReview?: string[];
  certificateProgress?: number;
}

export function generateParentProgressReport(data: ProgressReportData): string {
  const progressPercent = Math.round((data.lessonsWatched / data.totalLessons) * 100);
  const isComplete = data.userPlan === "complete";

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
      <p style="font-size: 16px; margin: 0 0 20px 0;">As-salamu alaykum ${data.parentName},</p>
      
      <p style="font-size: 15px; margin: 0 0 30px 0; color: #555;">
        Here's a summary of ${data.studentName}'s progress in learning the life of Prophet Muhammad ﷺ.
      </p>

      <!-- Overall Progress -->
      <div style="background: #f8f9fa; border-left: 4px solid #f4c542; padding: 20px; margin: 30px 0; border-radius: 8px;">
        <h3 style="margin: 0 0 15px 0; color: #1a1a1a; font-size: 18px;">📊 Overall Progress</h3>
        <div style="background: #e5e5e5; height: 24px; border-radius: 12px; overflow: hidden; margin: 10px 0;">
          <div style="background: linear-gradient(90deg, #f4c542 0%, #f4b542 100%); height: 100%; width: ${progressPercent}%; transition: width 0.3s;"></div>
        </div>
        <p style="margin: 10px 0 0 0; font-size: 14px; color: #666;">
          <strong style="color: #f4c542; font-size: 20px;">${progressPercent}%</strong> Complete
          <span style="color: #999;"> • ${data.lessonsWatched} of ${data.totalLessons} lessons</span>
        </p>
      </div>

      <!-- Weekly Highlights -->
      <h3 style="margin: 30px 0 15px 0; color: #1a1a1a; font-size: 18px;">✨ This Week's Highlights</h3>
      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #e5e5e5;">
              <span style="color: #666; font-size: 14px;">📹 Lessons Watched</span>
            </td>
            <td style="padding: 12px 0; border-bottom: 1px solid #e5e5e5; text-align: right;">
              <strong style="color: #1a1a1a; font-size: 16px;">${data.lessonsWatched}</strong>
            </td>
          </tr>
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #e5e5e5;">
              <span style="color: #666; font-size: 14px;">📄 Briefings Read</span>
            </td>
            <td style="padding: 12px 0; border-bottom: 1px solid #e5e5e5; text-align: right;">
              <strong style="color: #1a1a1a; font-size: 16px;">${data.briefingsRead}</strong>
            </td>
          </tr>
          <tr>
            <td style="padding: 12px 0; ${isComplete ? 'border-bottom: 1px solid #e5e5e5;' : ''}">
              <span style="color: #666; font-size: 14px;">⏱️ Study Time</span>
            </td>
            <td style="padding: 12px 0; ${isComplete ? 'border-bottom: 1px solid #e5e5e5;' : ''} text-align: right;">
              <strong style="color: #1a1a1a; font-size: 16px;">${data.studyTimeHours}h</strong>
            </td>
          </tr>
          ${isComplete && data.quizScore !== undefined ? `
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #e5e5e5;">
              <span style="color: #666; font-size: 14px;">📝 Quiz Score</span>
            </td>
            <td style="padding: 12px 0; border-bottom: 1px solid #e5e5e5; text-align: right;">
              <strong style="color: #f4c542; font-size: 16px;">${data.quizScore}%</strong>
            </td>
          </tr>
          ` : ''}
          ${isComplete && data.flashcardsReviewed ? `
          <tr>
            <td style="padding: 12px 0;">
              <span style="color: #666; font-size: 14px;">🗂️ Flashcards Reviewed</span>
            </td>
            <td style="padding: 12px 0; text-align: right;">
              <strong style="color: #1a1a1a; font-size: 16px;">${data.flashcardsReviewed}</strong>
            </td>
          </tr>
          ` : ''}
        </table>
      </div>

      <!-- Current Learning -->
      <h3 style="margin: 30px 0 15px 0; color: #1a1a1a; font-size: 18px;">📚 Current Learning</h3>
      <div style="background: #f4c542; background: linear-gradient(135deg, #f4c542 0%, #f4b542 100%); padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <p style="margin: 0 0 5px 0; color: #1a1a1a; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
          Currently on Part ${data.currentLesson.number}
        </p>
        <p style="margin: 0; color: #1a1a1a; font-size: 18px; font-weight: 600;">
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

      <!-- Next Steps -->
      <h3 style="margin: 30px 0 15px 0; color: #1a1a1a; font-size: 18px;">➡️ Recommended Next Step</h3>
      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <p style="margin: 0; color: #666; font-size: 15px;">
          Continue to <strong style="color: #1a1a1a;">Part ${data.suggestedNextLesson.number}: ${data.suggestedNextLesson.title}</strong>
        </p>
      </div>

      <!-- Encouragement -->
      <div style="background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%); padding: 25px; border-radius: 8px; border: 2px solid #f4c542; margin: 30px 0;">
        <p style="margin: 0; color: #1a1a1a; font-size: 15px; text-align: center; line-height: 1.7;">
          <strong style="color: #f4c542;">Keep up the excellent work!</strong><br>
          ${data.studentName} is making wonderful progress in learning about the life of Prophet Muhammad ﷺ. 
          ${isComplete ? 'The mastery system is helping build deep understanding.' : 'Continue watching and listening to strengthen understanding.'}
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
