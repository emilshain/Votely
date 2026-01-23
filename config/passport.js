const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const OAuth2Strategy = require('passport-oauth2').Strategy;

// ...

// LinkedIn Strategy
if (process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET) {
    passport.use('linkedin', new OAuth2Strategy({
        authorizationURL: 'https://www.linkedin.com/oauth/v2/authorization',
        tokenURL: 'https://www.linkedin.com/oauth/v2/accessToken',
        clientID: process.env.LINKEDIN_CLIENT_ID,
        clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
        callbackURL: "/api/auth/linkedin/callback",
        scope: ['openid', 'profile', 'email'],
        state: true // Recommended for security
    },
        async (accessToken, refreshToken, profile, done) => {
            try {
                // profile is empty here because we haven't implemented userProfile, 
                // but we can implementing it or fetching it here.
                // However, with generic OAuth2, we usually override userProfile, 
                // OR we just fetch it manually in this callback if we don't override.

                // Let's implement fetching userinfo manually here since we are in the verify callback
                const response = await fetch('https://api.linkedin.com/v2/userinfo', {
                    headers: { 'Authorization': `Bearer ${accessToken}` }
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch user profile');
                }

                const userProfile = await response.json();
                // userProfile structure: { sub: 'id', name: 'Name', email: 'email', picture: 'url', ... }

                let user = await User.findByLinkedinId(userProfile.sub);
                if (user) return done(null, user);

                const email = userProfile.email;
                if (email) {
                    user = await User.findByEmail(email);
                    if (user) {
                        await User.updateSocialId(user.id, 'linkedin', userProfile.sub);
                        user.linkedin_id = userProfile.sub;
                        return done(null, user);
                    }
                }

                const username = userProfile.name.replace(/\s+/g, '').toLowerCase() + Math.floor(Math.random() * 1000);
                const userId = await User.createFromSocial(username, email || `${userProfile.sub}@linkedin.oauth`, 'linkedin', userProfile.sub, userProfile.name);
                user = await User.findById(userId);
                done(null, user);
            } catch (err) {
                console.error(err);
                done(err, null);
            }
        }));
} else {
    console.warn("LINKEDIN_CLIENT_ID or LINKEDIN_CLIENT_SECRET not found in .env");
}
const User = require('../models/User');

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});

// Google Strategy
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "/api/auth/google/callback"
    },
        async (accessToken, refreshToken, profile, done) => {
            try {
                // Check if user exists with this google ID
                let user = await User.findByGoogleId(profile.id);
                if (user) return done(null, user);

                // Check if user exists with email
                const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
                if (email) {
                    user = await User.findByEmail(email);

                    if (user) {
                        // Link account
                        await User.updateSocialId(user.id, 'google', profile.id);
                        user.google_id = profile.id; // Update local object
                        return done(null, user);
                    }
                }

                // Create new user
                const username = profile.displayName.replace(/\s+/g, '').toLowerCase() + Math.floor(Math.random() * 1000);
                const userId = await User.createFromSocial(username, email || `${profile.id}@google.oauth`, 'google', profile.id, profile.displayName);
                user = await User.findById(userId);
                done(null, user);
            } catch (err) {
                done(err, null);
            }
        }));
} else {
    console.warn("GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET not found in .env");
}



module.exports = passport;
