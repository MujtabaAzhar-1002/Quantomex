// routes/clientReviews.js

const express = require("express");
const router = express.Router();
const ClientReview = require("../models/clientReviewModel"); // Import the ClientReview model
const { isAdmin } = require("../middleware/isAdmin"); // You may define your isAdmin middleware

const { uploader } = require("cloudinary").v2;
const multer = require("multer");
const { storage } = require("../cloudinary/index");
const upload = multer({ storage });

// Serve the OTP input form
router.get("/otpform", (req, res) => {
  res.render("./admin/otpform");
});

router.post("/testOtp", (req, res) => {
  const dummyOTP = "1234";
  const enteredOTP =
    req.body.digit1 + req.body.digit2 + req.body.digit3 + req.body.digit4;
  if (enteredOTP === dummyOTP) {
    return res.redirect("/client-reviews");
  }
  res.render("./admin/otpform", {
    error: "Invalid OTP. Please enter the correct OTP.",
  });
});

// Get Client Reviews Page
router.get("/client-reviews", async (req, res) => {
  res.render("./admin/clientReviews");
});
// Get Client Reviews Page
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
        message: "Erro    r deleting Client Review",
        error: error.message,
      });
  }
});

module.exports = router;
