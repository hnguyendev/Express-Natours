import axios from 'axios';
import { showAlert } from './alert';
const stripe = Stripe('pk_test_51ND9W3GcUkuZG4gIK6uCR2WIDC3dfTq3Z2J574u9tc0vhQmrx1ru4RbfCZvDGKCru9WWI4gdm4bJm0jH4T2j3e7c00sYHA713M');

export const bookTour = async (tourId) => {
    try {
        console.log(tourId);
        // get checkout session from server
        const session = await axios(`http://localhost:8000/api/v1/bookings/checkout-session/${tourId}`)
        console.log(session)
        // create checkout from + charge credit card
        await stripe.redirectToCheckout({
            sessionId: session.data.session.id
        })
    } catch(err) {
        console.log(err)
        showAlert('error', err);
    }

}