import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { useAuth } from '../context/AuthContext';
import { useBuyTicket } from '../context/buyTicketContext';

const CheckoutPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { confirmPayment, timeout } = useBuyTicket();
  const [orderData, setOrderData] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    billingAddress: '',
    city: '',
    postalCode: '',
    country: 'Singapore'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [timeLeft, setTimeLeft] = useState(5 * 60); // 5 minutes in seconds
  const [timerExpired, setTimerExpired] = useState(false);

  // Format time remaining as mm:ss
  const formatTimeLeft = () => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Timer effect
  useEffect(() => {
    if (timeLeft <= 0) {
      setTimerExpired(true);
      // Navigate back to the event page when timer expires
      if (orderData) {
        console.log('Timer expired. calling timeout function...')
        timeout(orderData.eventId, orderData.category)
          .then(() => {
            alert("Your checkout session has expired. You will be redirected back to the event page.");
            navigate(`/event/${orderData.eventId}`);
          })
          .catch((error) => {
            console.error('Error during timeout:', error);
            alert("An error occurred. Redirecting to the event page.");
            navigate(`/event/${orderData.eventId}`);
          })
      } else {
        navigate('/');
      }
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prevTime => prevTime - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, navigate, orderData, timeout]);

  useEffect(() => {
    // Get order data from navigation state
    if (location.state?.orderData) {
      const rawOrderData = location.state.orderData;

      // Calculate fees
      const subtotal = rawOrderData.totalPrice;
      const serviceFee = rawOrderData.seatQuantity * 10; // $10 service fee per ticket
      const total = subtotal + serviceFee;

      // Create enhanced order data with calculated fees
      const enhancedOrderData = {
        ...rawOrderData,
        subtotal,
        serviceFee,
        total,
        seatCount: rawOrderData.seatQuantity,
        pricePerTicket: rawOrderData.pricePerSeat,
        category: rawOrderData.selectedCategory
      };

      setOrderData(enhancedOrderData);
    } else {
      // If no order data, navigate back to home
      navigate('/');
    }

    // If user is authenticated, pre-fill user details
    if (isAuthenticated && user) {
      // Split the name if available
      const nameParts = user?.user_metadata?.name?.split(' ') || [];

      setFormData(prev => ({
        ...prev,
        firstName: nameParts[0] || '',
        lastName: nameParts.length > 1 ? nameParts.slice(1).join(' ') : '',
        email: user.email || ''
      }));
    }

    /*
    * MICROSERVICE INTEGRATION POINT:
    * 
    * In a real app with microservices:
    * 1. You would fetch the user's saved payment methods from a payments microservice
    * 2. You could prefill the user information from a users microservice
    * 3. You could validate the event availability with the inventory microservice
    * 
    * Example:
    * const fetchUserPaymentMethods = async () => {
    *   try {
    *     const response = await fetch('https://api-gateway.example.com/payments/methods', {
    *       headers: { Authorization: `Bearer ${token}` }
    *     });
    *     const data = await response.json();
    *     // Then use this data to show saved payment methods
    *   } catch (error) {
    *     console.error('Error fetching payment methods:', error);
    *   }
    * };
    */

    // Reset the timer when the page loads
    setTimeLeft(5 * 60);
    setTimerExpired(false);

  }, [location, navigate, isAuthenticated, user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });

    // Clear error when field is edited
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Only check if required fields are present, no format validation
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.cardNumber.trim()) newErrors.cardNumber = 'Card number is required';
    if (!formData.expiryDate.trim()) newErrors.expiryDate = 'Expiry date is required';
    if (!formData.cvv.trim()) newErrors.cvv = 'CVV is required';
    if (!formData.billingAddress.trim()) newErrors.billingAddress = 'Address is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.postalCode.trim()) newErrors.postalCode = 'Postal code is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      // Form has errors
      return;
    }

    setIsLoading(true);

    try {
      // Simulate API call
      console.log("Confirming payment...")
      const paymentResponse = await confirmPayment(orderData.eventId, orderData.category, orderData.seatCount)
      console.log('Payment confirmed:', paymentResponse)
      // // Simulate processing time
      // await new Promise(resolve => setTimeout(resolve, 2000));

      // // Generate a random confirmation number
      const confirmationNumber = 'TM-' + Math.random().toString(36).substring(2, 10).toUpperCase();

      // // Clear the timer by setting it to a value that won't trigger expiration
      // setTimeLeft(999999);

      // Navigate to confirmation page
      navigate('/payment-confirmation', {
        state: {
          orderData,
          confirmationNumber
        }
      });
    } catch (error) {
      console.error('Error processing payment:', error);
      setErrors({
        ...errors,
        form: 'There was an error processing your payment. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!orderData || timerExpired) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <>
      <h1 className="text-3xl font-bold text-center mb-4 text-gray-900 dark:text-white mt-4">Checkout</h1>

      {/* Checkout Timer */}
      <div className="max-w-lg mx-auto mb-6">
        <div className={`flex items-center justify-center p-3 rounded-lg ${timeLeft <= 60 ? 'bg-red-600/20' : 'bg-blue-600/20'}`}>
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <span className={`font-bold ${timeLeft <= 60 ? 'text-red-500' : 'text-blue-400'}`}>
            Time remaining: {formatTimeLeft()}
          </span>
        </div>
      </div>

      {!isAuthenticated && (
        <div className="mb-8 bg-gray-800 p-4 rounded-lg text-center">
          <p className="text-white mb-3">Sign in to auto-fill your information and access your saved payment methods.</p>
          <Link
            to="/login"
            state={{ returnTo: location.pathname, orderData }}
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Sign in to your account
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Order Summary */}
        <div className="lg:col-span-1">
          <Card className="p-6 bg-gray-800 border border-blue-500 mb-6 sticky top-8">
            <h2 className="text-xl font-semibold text-blue-400 mb-4">Order Summary</h2>

            <div className="mb-4">
              <h3 className="text-lg font-medium text-white mb-2">{orderData.eventTitle}</h3>
              <p className="text-gray-300 mb-1">{orderData.eventDate} at {orderData.eventTime}</p>
              <p className="text-gray-300 mb-3">{orderData.location}</p>
            </div>

            <div className="border-t border-blue-500/30 my-3"></div>

            <div className="flex justify-between mb-1">
              <span className="text-gray-300">Category:</span>
              <span className="text-white font-medium">{orderData.category}</span>
            </div>
            <div className="flex justify-between mb-1">
              <span className="text-gray-300">Seats:</span>
              <span className="text-white font-medium">{orderData.seatCount}</span>
            </div>
            <div className="flex justify-between mb-1">
              <span className="text-gray-300">Price per ticket:</span>
              <span className="text-white font-medium">${orderData.pricePerTicket.toFixed(2)}</span>
            </div>
            <div className="border-t border-blue-500/30 my-3"></div>
            <div className="flex justify-between mb-1">
              <span className="text-gray-300">Subtotal:</span>
              <span className="text-white font-medium">${orderData.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between mb-1">
              <span className="text-gray-300">Service Fee:</span>
              <span className="text-white font-medium">${orderData.serviceFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between mb-4">
              <span className="text-blue-400 font-bold">Total:</span>
              <span className="text-blue-400 font-bold">${orderData.total.toFixed(2)}</span>
            </div>
          </Card>
        </div>

        {/* Payment Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit}>
            <Card className="p-6 bg-gray-100 dark:bg-gray-800 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Customer Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label
                    htmlFor="firstName"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    First Name *
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 rounded-md border ${errors.firstName ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                  />
                  {errors.firstName && (
                    <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="lastName"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Last Name *
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 rounded-md border ${errors.lastName ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                  />
                  {errors.lastName && (
                    <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 rounded-md border ${errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                  />
                  {errors.email && (
                    <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="phoneNumber"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    id="phoneNumber"
                    name="phoneNumber"
                    placeholder="(123) 456-7890"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 rounded-md border ${errors.phoneNumber ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                  />
                  {errors.phoneNumber && (
                    <p className="text-red-500 text-xs mt-1">{errors.phoneNumber}</p>
                  )}
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-gray-100 dark:bg-gray-800 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Payment Information
              </h2>

              <div className="mb-4">
                <label
                  htmlFor="cardNumber"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Card Number *
                </label>
                <input
                  type="text"
                  id="cardNumber"
                  name="cardNumber"
                  placeholder="1234 5678 9012 3456"
                  value={formData.cardNumber}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 rounded-md border ${errors.cardNumber ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                />
                {errors.cardNumber && (
                  <p className="text-red-500 text-xs mt-1">{errors.cardNumber}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label
                    htmlFor="expiryDate"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Expiry Date (MM/YY) *
                  </label>
                  <input
                    type="text"
                    id="expiryDate"
                    name="expiryDate"
                    placeholder="MM/YY"
                    value={formData.expiryDate}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 rounded-md border ${errors.expiryDate ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                  />
                  {errors.expiryDate && (
                    <p className="text-red-500 text-xs mt-1">{errors.expiryDate}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="cvv"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    CVV *
                  </label>
                  <input
                    type="text"
                    id="cvv"
                    name="cvv"
                    placeholder="123"
                    value={formData.cvv}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 rounded-md border ${errors.cvv ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                  />
                  {errors.cvv && (
                    <p className="text-red-500 text-xs mt-1">{errors.cvv}</p>
                  )}
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-gray-100 dark:bg-gray-800 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Billing Address
              </h2>

              <div className="mb-4">
                <label
                  htmlFor="billingAddress"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Address *
                </label>
                <input
                  type="text"
                  id="billingAddress"
                  name="billingAddress"
                  value={formData.billingAddress}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 rounded-md border ${errors.billingAddress ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                />
                {errors.billingAddress && (
                  <p className="text-red-500 text-xs mt-1">{errors.billingAddress}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label
                    htmlFor="city"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    City *
                  </label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 rounded-md border ${errors.city ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                  />
                  {errors.city && (
                    <p className="text-red-500 text-xs mt-1">{errors.city}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="postalCode"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Postal Code *
                  </label>
                  <input
                    type="text"
                    id="postalCode"
                    name="postalCode"
                    value={formData.postalCode}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 rounded-md border ${errors.postalCode ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                  />
                  {errors.postalCode && (
                    <p className="text-red-500 text-xs mt-1">{errors.postalCode}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="country"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Country *
                  </label>
                  <select
                    id="country"
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="Singapore">Singapore</option>
                    <option value="United States">United States</option>
                    <option value="Canada">Canada</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="Australia">Australia</option>
                    <option value="Germany">Germany</option>
                    <option value="France">France</option>
                    <option value="Japan">Japan</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </Card>

            {errors.form && (
              <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
                {errors.form}
              </div>
            )}

            <div className="flex justify-end mb-8">
              <Button
                type="submit"
                variant="primary"
                className="py-3 px-8 text-lg font-bold"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : (
                  `Pay $${orderData.total.toFixed(2)}`
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default CheckoutPage; 