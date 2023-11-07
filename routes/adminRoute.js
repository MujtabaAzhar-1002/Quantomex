const express = require('express');
const router = express.Router();
const passport = require('passport');
const Admin = require('../models/Admin');
const CaseStudy = require('../models/caseStudyModel');
const Team = require('../models/teamModel');
const ClientReview = require("../models/clientReviewModel");
const Domain = require('../models/domainModel');
const {isAdmin} = require('../middleware/isAdmin');
// Admin Signup
router.get('/admin/signup', (req, res) => {
  res.render('./admin/adminSignup');
});

router.post('/admin/signup', async (req, res, next) => {
  const { username, password } = req.body;
  
  try {
    const foundUser = await Admin.findOne({ username });
    if (foundUser) {
        req.flash('error', 'Email already in use. Try different Email or Login instead.')
      return res.redirect('/admin/signup');
    }
    
    const admin = new Admin({ ...req.body });
    
    await Admin.register(admin, password);
    passport.authenticate('admin')(req, res, () => {
      res.redirect('/admin/login');
    });
  } catch (err) {
    next(err);
  }
});

// Admin Login
router.get('/admin/login', (req, res) => {
  res.render('./admin/adminLogin');
});

router.post('/admin/login', passport.authenticate('admin', {
  failureRedirect: '/admin/login',
  failureFlash: {type: 'error', message: 'Invalid Username/Password'}
}), (req, res) => {
   req.flash('success', 'Welcome back, admin!');
  
  res.redirect('/admin/case-studies');
});
// Other Pages
router.get('/', async (req, res) => {
  try {
    // Fetch case studies from the database
    const caseStudies = await CaseStudy.find();

    // Fetch domain counts
    const domainCounts = {};
    const domainNames = [
      'Website Designed',
      'Apps Developed',
      'SEO',
      'Happy Clients',
      'AI & IOT solutions',
      'Games Developed',
      'Data Science projects',
      'Other'
    ];

    for (const domainName of domainNames) {
      const count = await CaseStudy.countDocuments({ domain: domainName });
      domainCounts[domainName] = count;
    }
    const teamMembers = await Team.find();
    const cr = await ClientReview.find();
        // Render the homepage with case studies and domain counts
    res.render('./pages/homepage', { caseStudies, domainCounts, teamMembers, cr});
  } catch (error) {
    console.error('Error fetching case studies:', error);
    res.status(500).json({ message: 'Error fetching case studies', error: error.message });
  }
});


module.exports = router;