"""app/routes/payments.py"""


import stripe
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from os import getenv

from app.core.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User

router = APIRouter(prefix="/payments", tags=["payments"])

stripe.api_key = getenv("STRIPE_SECRET_KEY")
WEBHOOK_SECRET = getenv("STRIPE_WEBHOOK_SECRET")

# Stripe Price IDs — create them in your Stripe dashboard and set them in .env
PRICE_IDS: dict[str, str] = {
    "monthly": getenv("STRIPE_PRICE_MONTHLY", ""),
    "yearly": getenv("STRIPE_PRICE_YEARLY", ""),
}

FRONTEND_URL = getenv("FRONTEND_URL", "http://localhost:5173")


# ---------------------------------------------------------------------------
# POST /payments/create-checkout-session
# Called by PremiumPage.tsx when the user clicks "Subscribe Now"
# ---------------------------------------------------------------------------
@router.post("/create-checkout-session")
def create_checkout_session(
    body: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    plan: str = body.get("plan", "monthly")

    if plan not in PRICE_IDS:
        raise HTTPException(status_code=400, detail="Invalid plan.")

    price_id = PRICE_IDS[plan]
    if not price_id:
        raise HTTPException(
            status_code=503,
            detail="Payment terminal not configured yet.",
        )

    try:
        # Reuse existing Stripe customer or create a new one
        customer_id = current_user.stripe_customer_id
        if not customer_id:
            customer = stripe.Customer.create(
                email=current_user.email,
                metadata={"user_id": current_user.id},
            )
            customer_id = customer.id
            current_user.stripe_customer_id = customer_id
            db.commit()

        session = stripe.checkout.Session.create(
            customer=customer_id,
            payment_method_types=["card"],
            line_items=[{"price": price_id, "quantity": 1}],
            mode="subscription",
            success_url=f"{FRONTEND_URL}/premium/success",
            cancel_url=f"{FRONTEND_URL}/premium",
            metadata={"user_id": current_user.id, "plan": plan},
        )

        return {"checkout_url": session.url}

    except stripe.StripeError as e:
        raise HTTPException(status_code=502, detail=str(e))


# ---------------------------------------------------------------------------
# POST /payments/webhook
# Stripe calls this automatically after a successful payment.
# Register this URL in your Stripe dashboard → Webhooks.
# ---------------------------------------------------------------------------
@router.post("/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature", "")

    try:
        event = stripe.Webhook.construct_event(payload,
                                               sig_header,
                                               WEBHOOK_SECRET)
    except stripe.errors.SignatureVerificationError:
        raise HTTPException(status_code=400,
                            detail="Invalid Stripe signature.")

    # Payment succeeded → activate premium
    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        user_id = int(session["metadata"]["user_id"])
        subscription_id = session.get("subscription")

        user = db.query(User).filter(User.id == user_id).first()
        if user:
            user.is_premium = True
            user.stripe_subscription_id = subscription_id
            db.commit()

    # Subscription cancelled or payment failed → revoke premium
    elif event["type"] in ("customer.subscription.deleted",
                           "invoice.payment_failed"):
        obj = event["data"]["object"]
        customer_id = obj.get("customer")

        user = (
            db.query(User)
            .filter(User.stripe_customer_id == customer_id)
            .first()
        )
        if user:
            user.is_premium = False
            user.stripe_subscription_id = None
            db.commit()

    return {"status": "ok"}
