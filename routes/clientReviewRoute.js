// routes/clientReviews.js

const express = require("express");
const router = express.Router();
const ClientReview = require("../models/clientReviewModel"); // Import the ClientReview model
const { isAdmin } = require("../middleware/isAdmin"); // You may define your isAdmin middleware

const { uploader } = require("cloudinary").v2;
const multer = require("multer");
const { storage } = require("../cloudinary/index");
const upload = multer({ storage });
const Mailjet = require('node-mailjet');
const mailjet = Mailjet.apiConnect(process.env.MJ_APIKEY_PUBLIC, process.env.MJ_APIKEY_PRIVATE);

// Serve the OTP input form
router.get("/otpform", (req, res) => {
  res.render("./admin/otpform");
});
router.post("/sendOtp", async (req, res) => {
  // Generate a random 4-digit OTP
  const otp = Math.floor(1000 + Math.random() * 9000);

  // Get the user's entered email from the request
  const userEnteredEmail = req.body.email;
  req.session.otp = otp;
  // Create an email data object for sending the OTP
  const emailData = {
    FromEmail: 'operations@quantomex.com', // Set your email as the sender
    FromName: 'Quantomex',
    Recipients: [
      {
        Email: userEnteredEmail, // Use the user's entered email address
        Name: 'User',
      },
    ],
    Subject: 'Your OTP Code',
    TextPart: `Your OTP code is: ${otp}`,
    HTMLPart: `
      <h3>Your OTP Code</h3>
      <p style="font-size: 16px; color: #333;">Hello,</p>
      <p style="font-size: 16px; color: #333;">Your OTP code is: ${otp}</p>
    `,
  };

  // Send the email with the OTP
  const otpRequest = mailjet
    .post('send', { version: 'v3.1' })
    .request({
      Messages: [
        {
          From: {
            Email: emailData.FromEmail,
            Name: emailData.FromName,
          },
          To: emailData.Recipients,
          Subject: emailData.Subject,
          TextPart: emailData.TextPart,
          HTMLPart: emailData.HTMLPart,
        },
      ],
    });

  try {
    await otpRequest;
    res.redirect('/otpform')
  } catch (error) {
    console.error('Error sending OTP email:', error);
    res.status(500).json({ message: 'Error sending OTP email', error: error.message });
  }
});

router.post("/testOtp", (req, res) => {
  
  const enteredOTP =
    req.body.digit1 + req.body.digit2 + req.body.digit3 + req.body.digit4;

  
 if (enteredOTP === req.session.otp.toString()) {
    return res.redirect("/client-reviews");
  }

  res.render("./admin/otpform", {
    error: "Invalid OTP. Please enter the correct OTP.",
  });
});
// Middleware to check for OTP
function checkOTP(req, res, next) {
  if (req.session.otp) {
    // OTP is present, continue to the next middleware or route handler
    next();
  } else {
    // OTP is not present, redirect the user to the OTP form
    res.redirect('/otpform');
  }
}
// Get Client Reviews Page
router.get("/client-reviews", checkOTP, async (req, res) => {
  res.render("./admin/clientReviews");
});

// View Reviews on Admin Page
router.get("/admin/client-reviews", isAdmin, async (req, res) => {
  const clientReviewSubmissions = await ClientReview.find();
  res.render("./admin/clientReviewsSubmissions", { clientReviewSubmissions });
});
// Add Client Review
router.post("/addClientReview", upload.single("image"), async (req, res) => {
  try {
    const { clientName, rating, reviewOfJob } = req.body;
    const image = req.file ? req.file.path : "";
    const review = new ClientReview({ image, clientName, rating, reviewOfJob });
    await review.save();
    req.flash("success", "Client review added successfully");
    res.redirect("/client-reviews");
  } catch (error) {
    console.error("Error adding Client Review:", error);
    req.flash("error", "Error adding Client Review");
    res
      .status(500)
      .json({ message: "Error adding Client Review", error: error.message });
  }
});
// Delete Client Review
router.post("/deleteClientReview/:id", isAdmin, async (req, res) => {
  try {
    const deletedReview = await ClientReview.findByIdAndDelete(req.params.id);

    if (deletedReview.image) {
      await uploader.destroy(deletedReview.image);
    }

    req.flash("success", "Client Review deleted successfully");
    res.redirect("/admin/client-reviews");
  } catch (error) {
    console.error("Error deleting Client Review:", error);
    res
      .status(500)
      .json({
        message: "Error deleting Client Review",
        error: error.message,
      });
  }
});

module.exports = router;
