const express = require('express');
const router = express.Router();
const FormEntry = require('../models/FormEntry');
const Mailjet = require('node-mailjet');
const mailjet = Mailjet.apiConnect(process.env.MJ_APIKEY_PUBLIC, process.env.MJ_APIKEY_PRIVATE);

router.get('/getquote', (req, res) => {
    res.render('./admin/quotePage');
});

router.get('/admin/viewquote', async (req, res) => {
    getQuoteSubmissions = await FormEntry.find();
    res.render('./admin/adminQuotePage', { getQuoteSubmissions });
});

// Handle form submission
router.post('/submit', async (req, res) => {
  try {
      const { fullName, email, projectOverview, contactNumber } = req.body;

      const formEntry = new FormEntry({
          fullName,
          email,
          projectOverview,
          contactNumber,
      });
      await formEntry.save();

 
      const userEmailData = {
          FromEmail: 'operations@quantomex.com', 
          FromName: 'Quantomex',
          Recipients: [
              {
                  Email: email, 
                  Name: fullName, 
              },
          ],
          Subject: 'Your Quotation Submission',
          TextPart: 'Thank you for submitting your quotation. We have received your request and will get back to you shortly.',
          HTMLPart: `
              <h3>Quotation Submission Confirmation</h3>
              <p style="font-size: 16px; color: #333;">Hello ${fullName},</p>
              <p style="font-size: 16px; color: #333;">Thank you for submitting your quotation. We have received your request and will get back to you shortly.</p>
              <p style="font-size: 16px; color: #333;">Your Details:</p>
              <ul>
                  <li style="font-size: 16px; color: #333;">Full Name: ${fullName}</li>
                  <li style="font-size: 16px; color: #333;">Email: ${email}</li>
                  <li style="font-size: 16px; color: #333;">Project Overview: ${projectOverview}</li>
                  <li style="font-size: 16px; color: #333;">Contact Number: ${contactNumber}</li>
              </ul>
              <p style="font-size: 16px; color: #333;">We will be in touch with you soon.</p>
              <p style="font-size: 16px; color: #333;">Thank you for choosing Quantomex.</p>
          `
      };

      // Create the email data object for the admin
      const adminEmailData = {
          FromEmail: 'operations@quantomex.com', // Set your email as the sender
          FromName: 'Quantomex',
          Recipients: [
              {
                  Email: 'operations@quantomex.com', // Set the admin's email address
                  Name: 'Admin',
              },
          ],
          Subject: 'New Quote Received',
          TextPart: `A new quote submission has been received.\n\n
Full Name: ${fullName}\n
Email: ${email}\n
Project Overview: ${projectOverview}\n
Contact Number: ${contactNumber}`,
          HTMLPart: `
              <h3>New Quote Received</h3>
              <p style="font-size: 16px; color: #333;">Hello Quantomex Team,</p>
              <p style="font-size: 16px; color: #333;">A new quote submission has been received:</p>
              <ul>
                  <li style="font-size: 16px; color: #333;">Full Name: ${fullName}</li>
                  <li style="font-size: 16px; color: #333;">Email: ${email}</li>
                  <li style="font-size: 16px; color: #333;">Project Overview: ${projectOverview}</li>
                  <li style="font-size: 16px; color: #333;">Contact Number: ${contactNumber}</li>
              </ul>
              <p style="font-size: 16px; color: #333;">Please review this quote request and take appropriate action.</p>
              <p style="font-size: 16px; color: #333;">Thank you for your attention.</p>
          `
      };

      // Send emails to the user and admin
      const userRequest = mailjet
          .post('send', { version: 'v3.1' })
          .request({
              Messages: [
                  {
                      From: {
                          Email: userEmailData.FromEmail,
                          Name: userEmailData.FromName,
                      },
                      To: userEmailData.Recipients,
                      Subject: userEmailData.Subject,
                      TextPart: userEmailData.TextPart,
                      HTMLPart: userEmailData.HTMLPart,
                  },
              ],
          });

      const adminRequest = mailjet
          .post('send', { version: 'v3.1' })
          .request({
              Messages: [
                  {
                      From: {
                          Email: adminEmailData.FromEmail,
                          Name: adminEmailData.FromName,
                      },
                      To: adminEmailData.Recipients,
                      Subject: adminEmailData.Subject,
                      TextPart: adminEmailData.TextPart,
                      HTMLPart: adminEmailData.HTMLPart,
                  },
              ],
          });

      // Handle email sending results (for both user and admin emails)
      const userResponse = await userRequest;
      const adminResponse = await adminRequest;

     // Redirect to a success page or wherever you want
     res.redirect('/getquote'); 

  } catch (error) {
      console.error('Error saving form entry:', error);
      req.flash('error', 'Error sending quotation');
      res.status(500).json({ message: 'Error saving form entry', error: error.message });
  }
});


router.post('/deleteQuote/:id', async (req, res) => {
    try {
        // Find and delete the quote submission by its ID
        const deletedSubmission = await FormEntry.findByIdAndDelete(req.params.id);

        req.flash('success', 'Quote submission deleted successfully');
        res.redirect('/admin/viewquote'); // Redirect to the viewquote page or wherever you want
    } catch (error) {
        console.error('Error deleting quote submission:', error);
        req.flash('error', 'Error deleting quote submission');
        res.status(500).json({ message: 'Error deleting quote submission', error: error.message });
    }
});

module.exports = router;
