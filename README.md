# Sakhi (demo)
Windows, from the project folder:
1. `npm install`
2. Terminal 1: `npm run api`  (JSON Server on http://localhost:3001)
3. Terminal 2: `npm run dev`  (open the URL Vite prints)

Demo accounts (password `demo123`): admin@sakhi.demo, seller@sakhi.demo, newseller@sakhi.demo (pending), buyer@sakhi.demo, donor@sakhi.demo, volunteer@sakhi.demo.
Coupons to try: SAKHI10 (min ₹500), OLD50 (expired, should be rejected).

NOT PRODUCTION SAFE: JSON Server has no auth, db.json is world-writable via the API, passwords are plain demo text,
and route guards/ownership checks run in the browser only. Orders and donations are simulated. Use fictional data only.

## Routes
Public: /, /shop, /training, /jobs, /donate, /events, /forum, /groups, /stories, /faq, /contact, /about, /privacy, /terms, /more (all pages).
Signed in: /dashboard, /cart, /orders, /wishlist, /my-donations, /mentorship, /assistance, /volunteer, /support, /feedback, /profile, /notifications.
Admin: /admin/<section> (users, products, orders, reviews, coupons, trainingPrograms, jobs, selfHelpGroups, successStories, mentorshipRequests, initiatives, donations, financialAssistanceApplications, volunteerApplications, events, forumPosts, reports, complaints, supportTickets, faqs, contactMessages, activityLogs, analytics ...).
Fundraising uses one model: `initiatives` (campaigns are the same records), so there is no separate `campaigns` collection.

## Added in round 3
Buyer/donor/volunteer dashboard (profile summary, orders, donations, events, community activity, tickets), seller sales report with CSV export and product editing (edits go back to pending approval), full home page sections with testimonials, footer, mobile menu, skip link, and an admin category dropdown plus admin product creation.

## Round 4
Recharts charts (admin analytics, seller report), seller views of approved reviews / training registrations / mentorship requests, app-level ownership checks (`assertOwner` in src/api.js; still browser-side only), and a product edit approval flow (live listing unchanged until an admin approves the edit).

## Round 5: UI and role layouts
Every signed-in role now gets a sidebar dashboard (buyer, seller, donor, volunteer, admin) with all its modules, a notification bell, and a responsive off-canvas menu on mobile. Seller pages: /seller/products, /seller/inventory, /seller/orders, /seller/reports, /seller/reviews. New: /my-reviews (buyer), receipt viewing and printing (donor). Modern theme in src/styles.css with lucide-react icons and coloured status badges.

## Fix: lucide-react removed
lucide-react (thousands of files) caused slow/corrupt installs on Windows. Icons are now built in (src/icons.jsx). Run `npm install` in a fresh folder.
