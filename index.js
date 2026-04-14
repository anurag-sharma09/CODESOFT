const app = require('./api/index');
const PORT = process.env.PORT || 5000;

// Export the app for Vercel
module.exports = app;

// Only listen if running locally (not on Vercel)
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`🚀 Local Development Server running on http://localhost:${PORT}`);
        console.log(`🔗 API Endpoint: http://localhost:${PORT}/api`);
    });
}
