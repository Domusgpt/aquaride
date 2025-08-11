const {onCall, HttpsError} = require('firebase-functions/v2/https');
const {initializeApp} = require('firebase-admin/app');
const {getFirestore, FieldValue} = require('firebase-admin/firestore');

initializeApp();
const db = getFirestore();

exports.requestRide = onCall(async (request) => {
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }
    const passengerId = request.auth.uid;
    const { pickup, dropoff, boatType } = request.data;
    if (!pickup || !dropoff || !boatType || pickup.trim() === '' || dropoff.trim() === '') {
        throw new HttpsError('invalid-argument', 'Missing ride details. Please provide pickup location, dropoff location, and boat type.');
    }
    const rideRef = db.collection('rides').doc();
    await rideRef.set({
        passengerId: passengerId,
        pickupLocation: pickup,
        dropoffLocation: dropoff,
        boatType: boatType,
        status: 'pending',
        timestamp: FieldValue.serverTimestamp(),
    });
    console.log(`New ride request from ${passengerId}: ${pickup} to ${dropoff} for ${boatType}`);
    return { rideId: rideRef.id, message: 'Ride request submitted successfully!' };
});