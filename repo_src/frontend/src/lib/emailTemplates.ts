export interface EmailTemplate {
  subject: string;
  html: string;
}

export const createProfileInvitationEmail = (
  participantName: string,
  eventName: string,
  profileUrl: string,
  eventUrl: string,
  completionToken?: string // Kept for backward compatibility, but unused
): EmailTemplate => {
  // Create completion URL with query parameter
  // Extract profile ID from profileUrl (e.g., /profile/123 -> 123)
  const profileId = profileUrl.split('/').pop();
  
  // Use environment variable first, then fall back to production URL
  const baseUrl = import.meta.env.VITE_PUBLIC_APP_URL || 'https://www.numina.cam';
  // Simple completion URL without token
  const completionUrl = `${baseUrl}?complete=${profileId}`;
  
  console.log('Email template debug:', {
    profileUrl,
    profileId,
    baseUrl,
    completionUrl,
    envVar: import.meta.env.VITE_PUBLIC_APP_URL
  });
  
  return {
    subject: `Complete your profile for ${eventName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Complete Your Profile - Numina</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8fafc; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
            .header { background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); color: white; padding: 40px 30px; text-align: center; }
            .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
            .header p { margin: 10px 0 0; opacity: 0.9; font-size: 16px; }
            .content { padding: 40px 30px; }
            .content h2 { color: #1f2937; margin: 0 0 20px; font-size: 24px; }
            .content p { margin: 0 0 16px; color: #4b5563; font-size: 16px; }
            .event-info { background: #f3f4f6; border-radius: 8px; padding: 20px; margin: 24px 0; }
            .event-info h3 { margin: 0 0 12px; color: #1f2937; font-size: 18px; }
            .event-info p { margin: 0; color: #6b7280; }
            .cta-button { display: inline-block; background: #7c3aed; color: white !important; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 24px 0; transition: background-color 0.2s; }
            .cta-button:hover { background: #6d28d9; }
            .secondary-button { display: inline-block; background: #e5e7eb; color: #374151; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 500; font-size: 14px; margin: 12px 8px 12px 0; }
            .footer { background: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb; }
            .footer p { margin: 0; color: #6b7280; font-size: 14px; }
            .footer a { color: #7c3aed; text-decoration: none; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <img src="https://www.numina.cam/images/Numina-Logo-Only-200.png" alt="Numina Logo" style="height: 40px; margin-bottom: 10px;">
              <h1 style="margin-top: 10px;">Numina</h1>
              <p>Your portrait is ready to share your story</p>
            </div>
            
            <div class="content">
              <h2>Hi ${participantName}! 👋</h2>
              
              <p>Great news! Your professional portrait from <strong>${eventName}</strong> is ready, and we'd love for you to share your story with the community.</p>
              
              <div class="event-info">
                <h3>📅 ${eventName}</h3>
                <p>Your photos have been uploaded, you'll be able to download all your photos after completing your profile.</p>
              </div>
              
              <p>Complete your profile to:</p>
              <ul style="color: #4b5563; margin: 16px 0; padding-left: 20px;">
                <li>Add your professional story and background</li>
                <li>Choose which photos to feature</li>
                <li>Connect with other participants</li>
              </ul>
              
              <p style="margin: 24px 0; font-size: 14px; color: #6b7280; background: #f9fafb; padding: 16px; border-radius: 8px; border-left: 4px solid #7c3aed;">
                Please note - it is entirely your choice if you are happy to share your profile and story with the community, we hope you do, but it's totally cool, if you prefer to keep it private. You have the power to toggle it private or public anytime :)
              </p>
              
              <div style="text-align: center; margin: 32px 0;">
                <a href="${completionUrl}" class="cta-button">Complete Your Profile</a>
              </div>
              
              <p>You can also view the event page to see other participants:</p>
              <div style="text-align: center;">
                <a href="${eventUrl}" class="secondary-button">View Event Page</a>
              </div>
              
              <p style="margin-top: 32px; font-size: 14px; color: #6b7280;">
                This invitation will remain active for 30 days. If you have any questions, please submit it via the feedback icon in the top right section of the website next to the play icon.
              </p>
            </div>
            
            <div class="footer">
              <p>
                Sent by <a href="https://numina.com">Numina</a><br>
                Celebrating the human spirit through portraits and stories
              </p>
            </div>
          </div>
        </body>
      </html>
    `
  };
};

export const createWelcomeMagicLinkEmail = (
  participantName: string,
  profileUrl: string,
  magicLinkUrl: string
): EmailTemplate => {
  return {
    subject: `Welcome to Numina - Your Profile is Live!`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to Numina</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8fafc; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
            .header { background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); color: white; padding: 40px 30px; text-align: center; }
            .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
            .content { padding: 40px 30px; }
            .content h2 { color: #1f2937; margin-top: 0; }
            .magic-link-btn { display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
            .footer { background: #f9fafb; padding: 30px; text-align: center; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Welcome to Numina!</h1>
            </div>
            <div class="content">
              <h2>Hi ${participantName},</h2>
              <p>Congratulations! Your profile is now live on Numina and looks amazing.</p>
              
              <p><strong>🔗 Easy Access with Magic Links</strong></p>
              <p>We've created an account for you that works with magic links - no passwords needed! Just click the button below to sign in instantly:</p>
              
              <div style="text-align: center;">
                <a href="${magicLinkUrl}" class="magic-link-btn">✨ Sign In to Your Profile</a>
              </div>
              
              <p><strong>What you can do:</strong></p>
              <ul>
                <li>📝 Edit your story and answers anytime</li>
                <li>📸 Change your main photo for the directory</li>
                <li>🏷️ Update your tags and social links</li>
                <li>👀 See how your profile appears to others</li>
              </ul>
              
              <p><strong>Your Profile:</strong><br>
              <a href="${profileUrl}">View your live profile →</a></p>
              
              <p>For future access, we'll send you magic links - just check your email and click to sign in instantly. No passwords to remember!</p>
              
              <p>Welcome to the community! 🌟</p>
            </div>
            <div class="footer">
              <p>This email was sent by Numina.<br>
              If you have any questions, just reply to this email.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `Welcome to Numina, ${participantName}!

Your profile is now live and looks amazing.

We've created an account for you that works with magic links - no passwords needed! 

Sign in instantly: ${magicLinkUrl}

What you can do:
- Edit your story and answers anytime
- Change your main photo for the directory  
- Update your tags and social links
- See how your profile appears to others

Your Profile: ${profileUrl}

For future access, we'll send you magic links - just check your email and click to sign in instantly.

Welcome to the community!`
  };
};

export const createProfileCompletionEmail = (
  participantName: string,
  profileUrl: string
): EmailTemplate => {
  return {
    subject: `Your profile is now live on Humora!`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Profile Live - Numina</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8fafc; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
            .header { background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: white; padding: 40px 30px; text-align: center; }
            .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
            .header p { margin: 10px 0 0; opacity: 0.9; font-size: 16px; }
            .content { padding: 40px 30px; }
            .content h2 { color: #1f2937; margin: 0 0 20px; font-size: 24px; }
            .content p { margin: 0 0 16px; color: #4b5563; font-size: 16px; }
            .success-badge { background: #d1fae5; color: #065f46; padding: 12px 20px; border-radius: 8px; text-align: center; margin: 24px 0; font-weight: 600; }
            .cta-button { display: inline-block; background: #059669; color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 24px 0; }
            .share-buttons { display: flex; gap: 12px; justify-content: center; margin: 24px 0; flex-wrap: wrap; }
            .share-button { display: inline-block; padding: 10px 16px; border-radius: 6px; text-decoration: none; font-weight: 500; font-size: 14px; }
            .share-linkedin { background: #0077b5; color: white; }
            .share-twitter { background: #1da1f2; color: white; }
            .share-copy { background: #e5e7eb; color: #374151; }
            .footer { background: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb; }
            .footer p { margin: 0; color: #6b7280; font-size: 14px; }
            .footer a { color: #059669; text-decoration: none; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Congratulations!</h1>
              <p>Your profile is now live on Humora</p>
            </div>
            
            <div class="content">
              <div class="success-badge">
                ✅ Profile Successfully Published
              </div>
              
              <h2>Hi ${participantName}!</h2>
              
              <p>Your profile is now live and ready to inspire others! Your story and professional portrait are now part of the Numina community.</p>
              
              <div style="text-align: center; margin: 32px 0;">
                <a href="${profileUrl}" class="cta-button">View Your Profile</a>
              </div>
              
              <p><strong>Share your profile:</strong></p>
              <div class="share-buttons">
                <a href="https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(profileUrl)}" class="share-button share-linkedin">Share on LinkedIn</a>
                <a href="https://twitter.com/intent/tweet?url=${encodeURIComponent(profileUrl)}&text=Check out my professional story on Humora!" class="share-button share-twitter">Share on Twitter</a>
                <a href="#" onclick="navigator.clipboard.writeText('${profileUrl}')" class="share-button share-copy">Copy Link</a>
              </div>
              
              <p>Your profile includes:</p>
              <ul style="color: #4b5563; margin: 16px 0; padding-left: 20px;">
                <li>Your professional portrait and story</li>
                <li>Social media links and contact information</li>
                <li>Tags highlighting your expertise</li>
                <li>Connection to your event</li>
              </ul>
              
              <p style="margin-top: 32px; font-size: 14px; color: #6b7280;">
                You can update your profile anytime by visiting the link above. Thank you for being part of the Numina community!
              </p>
            </div>
            
            <div class="footer">
              <p>
                Sent by <a href="https://numina.com">Numina</a><br>
                Celebrating the human spirit through portraits and stories
              </p>
            </div>
          </div>
        </body>
      </html>
    `
  };
};

export const createEventNotificationEmail = (
  eventName: string,
  eventLocation: string,
  eventDate: string,
  participantCount: number,
  eventUrl: string
): EmailTemplate => {
  return {
    subject: `New portraits available from ${eventName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Event - Numina</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8fafc; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
            .header { background: linear-gradient(135deg, #0891b2 0%, #06b6d4 100%); color: white; padding: 40px 30px; text-align: center; }
            .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
            .header p { margin: 10px 0 0; opacity: 0.9; font-size: 16px; }
            .content { padding: 40px 30px; }
            .content h2 { color: #1f2937; margin: 0 0 20px; font-size: 24px; }
            .content p { margin: 0 0 16px; color: #4b5563; font-size: 16px; }
            .event-card { background: #f0f9ff; border: 1px solid #0891b2; border-radius: 8px; padding: 24px; margin: 24px 0; }
            .event-card h3 { margin: 0 0 16px; color: #0891b2; font-size: 20px; }
            .event-detail { display: flex; align-items: center; margin: 8px 0; color: #374151; }
            .event-detail strong { margin-left: 8px; }
            .cta-button { display: inline-block; background: #0891b2; color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 24px 0; }
            .stats { display: flex; justify-content: space-around; background: #f9fafb; border-radius: 8px; padding: 20px; margin: 24px 0; }
            .stat { text-align: center; }
            .stat-number { font-size: 24px; font-weight: 700; color: #0891b2; }
            .stat-label { font-size: 14px; color: #6b7280; margin-top: 4px; }
            .footer { background: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb; }
            .footer p { margin: 0; color: #6b7280; font-size: 14px; }
            .footer a { color: #0891b2; text-decoration: none; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📸 New Event Added</h1>
              <p>Fresh portraits and stories from the community</p>
            </div>
            
            <div class="content">
              <h2>Discover New Stories</h2>
              
              <p>A new event has been added to Numina with beautiful portraits and inspiring stories from the community.</p>
              
              <div class="event-card">
                <h3>${eventName}</h3>
                <div class="event-detail">
                  📍 <strong>${eventLocation}</strong>
                </div>
                <div class="event-detail">
                  📅 <strong>${new Date(eventDate).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}</strong>
                </div>
              </div>
              
              <div class="stats">
                <div class="stat">
                  <div class="stat-number">${participantCount}</div>
                  <div class="stat-label">Participants</div>
                </div>
                <div class="stat">
                  <div class="stat-number">${participantCount}</div>
                  <div class="stat-label">New Stories</div>
                </div>
              </div>
              
              <div style="text-align: center; margin: 32px 0;">
                <a href="${eventUrl}" class="cta-button">Explore Event</a>
              </div>
              
              <p>Each participant brings their unique perspective and professional journey. Discover their stories, connect with like-minded individuals, and be inspired by the diversity of experiences in our community.</p>
              
              <p style="margin-top: 32px; font-size: 14px; color: #6b7280;">
                You're receiving this because you're part of the Numina community. You can update your notification preferences in your account settings.
              </p>
            </div>
            
            <div class="footer">
              <p>
                Sent by <a href="https://numina.com">Numina</a><br>
                Celebrating the human spirit through portraits and stories
              </p>
            </div>
          </div>
        </body>
      </html>
    `
  };
};