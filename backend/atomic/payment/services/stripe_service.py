# services/stripe_service.py
import stripe
from config import Config
import uuid

# Set your Stripe secret key and version
stripe.api_key = Config.STRIPE_SECRET_KEY
stripe.api_version = Config.STRIPE_API_VERSION

def create_charge(amount, currency, source, chargeType, idempotencyKey=None):
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
            description=chargeType,
            idempotency_key=idempotencyKey
        )
        return charge
    except stripe.error.StripeError as e:
        return {"error": str(e)}

def refund_charge(stripeID, amount=None, idempotencyKey=None):
    """
    Process a refund for a given charge.
    
    Parameters:
      - charge_id (str): The Stripe charge ID to refund.
      - amount (int, optional): Amount in cents for a partial refund. If None, a full refund is processed.
      - idempotency_key (str, optional): A unique key to ensure idempotency.
    
    Returns:
      - dict: The refund object from Stripe if successful, or an error dictionary.
    """
    try:
        # Build the refund parameters. If amount is provided, include it; otherwise, omit it for a full refund.
        params = {
            'charge': stripeID,
            'idempotency_key': idempotencyKey
        }
        if amount is not None:
            params['amount'] = amount

        refund = stripe.Refund.create(**params)
        return refund
    except stripe.error.StripeError as e:
        return {"error": str(e)}