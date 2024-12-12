const STRIPE_SECRET_KEY = 'sk_live_...JeXr'

const express = require("express");
const stripe = require("stripe")(STRIPE_SECRET_KEY);

const app = express();
app.use(express.json());

const cors = require('cors');
app.use(cors());

app.options('*', cors());

app.use(function(req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', true);
  next();
});

app.get('/', (req, res) => {
  res.send('Server is running!');
});

app.post("/create-connected-account", async (req, res) => {
  try {
    const { customerName, fundName } = req.body;

    const account = await stripe.accounts.create({
      type: "express",
      metadata: {
        customer_name: customerName,
        fund_name: fundName,
      },
    });

    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: "/reauth",
      return_url: "/success",
      type: "account_onboarding",
    });

    res.json({ accountId: account.id, accountLink: accountLink.url });
  } catch (err) {
    res.status(500).send(err.message);
  }
});


app.post("/create-payment-intent", async (req, res) => {
    try {
      const { amount, currency, connectedAccountId, contributorName } = req.body;
  
      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency,
        metadata: {
          contributor_name: contributorName,
          connected_account_id: connectedAccountId,
        },
        transfer_data: {
          destination: connectedAccountId,
        },
      });
  
      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (err) {
      res.status(500).send(err.message);
    }
  });

  app.post("/webhook", async (req, res) => {
    let event;
  
    try {
      const signature = req.headers["stripe-signature"];
      event = stripe.webhooks.constructEvent(
        req.body,
        signature,
        "your_webhook_secret"
      );
  
      if (event.type === "payment_intent.succeeded") {
        const paymentIntent = event.data.object;
        console.log("Payment succeeded for fund:", paymentIntent.metadata.fund_name);
      }
  
      res.json({ received: true });
    } catch (err) {
      res.status(400).send(`Webhook error: ${err.message}`);
    }
  });

PORT = 5000; 
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  
