const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
const googleOptions = require("./config.json").google;

module.exports = (passport) => {
    passport.serializeUser((user, done) => {
        done(null, user);
    });
    passport.deserializeUser((user, done) => {
        done(null, user);
    });
    passport.use(new GoogleStrategy(
        googleOptions,
        (token, refreshToken, profile, done) => {
            return done(null, {
                profile: profile,
                token: token
            });
        }));
};
