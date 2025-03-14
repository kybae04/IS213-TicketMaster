# services/stripe_service.py
import stripe
from config import Config

# Set your Stripe secret key and version
stripe.api_key = Config.STRIPE_SECRET_KEY
stripe.api_version = Config.STRIPE_API_VERSION

def create_charge(amount, currency, source, description, idempotency_key):
    """
    Create a payment charge using Stripe.
    :param amount: Amount in cents (e.g., 5000 for $50.00)
    :param currency: Currency code (e.g., 'usd')
    :param source: Payment token (provided from the frontend via Stripe.js)
    :param description: Description for the charge
    :param idempotency_key: Unique key to ensure idempotency
    :return: Charge object from Stripe or an error dictionary
    """
    try:
        charge = stripe.Charge.create(
            amount=amount,
            currency=currency,
            source=source,
            description=description,
            idempotency_key=idempotency_key
        )
        return charge
    except stripe.error.StripeError as e:
        return {"error": str(e)}

def refund_charge(charge_id, amount, idempotency_key):
    """
    Process a refund for a given charge.
    :param charge_id: The Stripe charge ID to refund
    :param amount: Amount in cents to refund (if None, full refund)
    :param idempotency_key: Unique key to ensure idempotency for refund
    :return: Refund object from Stripe or an error dictionary
    """
    try:
        refund = stripe.Refund.create(
            charge=charge_id,
            amount=amount,
            idempotency_key=idempotency_key
        )
        return refund
    except stripe.error.StripeError as e:
        return {"error": str(e)}
