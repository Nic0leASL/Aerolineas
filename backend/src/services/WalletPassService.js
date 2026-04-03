/**
 * Service for generating Apple Wallet and Google Pay passes for boarding passes
 * Supports both .pkpass (Apple Wallet) and Google Pay formats
 */

import fs from 'fs';
import path from 'path';

class WalletPassService {
    constructor() {
        this.passesDir = './src/data/passes';
        this.ensureDirectoryExists();
    }

    /**
     * Ensure passes directory exists
     */
    ensureDirectoryExists() {
        if (!fs.existsSync(this.passesDir)) {
            fs.mkdirSync(this.passesDir, { recursive: true });
        }
    }

    /**
     * Generate Apple Wallet pass (.pkpass format)
     * @param {Object} bookingData - Flight, seat, and passenger data
     * @returns {Object} - Pass data
     */
    generateAppleWalletPass(bookingData) {
        const { flight, seat, user = 'Alexander S.' } = bookingData;

        try {
            // Create pass payload compatible with Apple Wallet
            const passData = {
                formatVersion: 1,
                passTypeIdentifier: 'pass.com.skynet.boarding',
                serialNumber: `${flight.id}-${seat.seatNumber}`,
                teamIdentifier: 'SKYNET',
                organizationName: 'SkyNet Airlines',
                logoText: 'SkyNet Airlines',
                description: 'Boarding Pass',
                foregroundColor: 'rgb(255, 255, 255)',
                backgroundColor: 'rgb(15, 23, 42)',
                labelColor: 'rgb(156, 163, 175)',
                boardingPass: {
                    transitType: 'PKTransitTypeAir',
                    primaryFields: [
                        {
                            key: 'origin',
                            label: 'FROM',
                            value: flight.origin,
                            textAlignment: 'PKTextAlignmentLeft'
                        },
                        {
                            key: 'destination',
                            label: 'TO',
                            value: flight.destination,
                            textAlignment: 'PKTextAlignmentRight'
                        }
                    ],
                    secondaryFields: [
                        {
                            key: 'flight',
                            label: 'FLIGHT',
                            value: flight.flightNumber || flight.id,
                            textAlignment: 'PKTextAlignmentCenter'
                        },
                        {
                            key: 'date',
                            label: 'DEPARTURE',
                            value: new Date(flight.departureTime).toLocaleDateString(),
                            textAlignment: 'PKTextAlignmentCenter'
                        }
                    ],
                    auxiliaryFields: [
                        {
                            key: 'passenger',
                            label: 'PASSENGER',
                            value: user
                        },
                        {
                            key: 'seat',
                            label: 'SEAT',
                            value: seat.seatNumber
                        },
                        {
                            key: 'seattype',
                            label: 'CLASS',
                            value: seat.seatType
                        },
                        {
                            key: 'price',
                            label: 'PRICE',
                            value: `$${seat.price}`
                        }
                    ],
                    backFields: [
                        {
                            key: 'info',
                            label: 'INFORMATION',
                            value: 'Thank you for choosing SkyNet Airlines. Eventual consistency guaranteed.'
                        }
                    ]
                },
                barcode: {
                    format: 'PKBarcodeFormatCode128',
                    message: `${flight.id}${seat.seatNumber}`,
                    messageEncoding: 'iso-8859-1'
                },
                relevantDate: flight.departureTime
            };

            const filename = `Boarding_Pass_${flight.id}_${seat.seatNumber}.pkpass`;
            return { filename, passData };
        } catch (error) {
            console.error('Error generating Apple Wallet pass:', error);
            throw new Error('Failed to generate Apple Wallet pass');
        }
    }

    /**
     * Generate Google Pay pass (JSON format)
     * @param {Object} bookingData - Flight, seat, and passenger data
     * @returns {Object} - Google Pay pass object
     */
    generateGooglePayPass(bookingData) {
        const { flight, seat, user = 'Alexander S.' } = bookingData;

        try {
            const passData = {
                '@context': 'https://schemas.google.com/tapandpay/schemas/rest-1',
                '@type': 'EventTicket',
                'id': `${flight.id}-${seat.seatNumber}-${Date.now()}`,
                'classId': 'com.skynet.boarding.pass',
                'classReference': {
                    'id': 'com.skynet.boarding.pass',
                    'reviewStatus': 'UNDER_REVIEW',
                    'issuerName': 'SkyNet Airlines',
                    'eventName': {
                        'defaultValue': {
                            'language': 'en-US',
                            'value': `Flight ${flight.flightNumber || flight.id}`
                        }
                    },
                    'eventDateTime': {
                        'start': new Date(flight.departureTime).toISOString()
                    },
                    'venueName': {
                        'defaultValue': {
                            'language': 'en-US',
                            'value': `${flight.origin} → ${flight.destination}`
                        }
                    },
                    'locations': [
                        {
                            'latitude': 40.7580,
                            'longitude': -73.9855
                        }
                    ]
                },
                'objectReferences': [
                    {
                        'id': 'boarding_pass_section',
                        'classId': 'com.skynet.boarding.pass'
                    }
                ],
                'barcode': {
                    'type': 'CODE_128',
                    'value': `${flight.id}${seat.seatNumber}`
                },
                'ticketNumber': seat.seatNumber,
                'ticketLegDetails': {
                    'carriage': seat.seatType === 'FIRST_CLASS' ? 'A' : 'B',
                    'seat': seat.seatNumber,
                    'gate': 'TBD',
                    'platform': 'TBD'
                },
                'passengerName': user,
                'heroImage': {
                    'sourceUrl': {
                        'uri': 'https://images.unsplash.com/photo-1552105554-5fefe8c9ef14?w=400'
                    }
                },
                'textModulesData': [
                    {
                        'header': 'PASSENGER',
                        'body': user
                    },
                    {
                        'header': 'SEAT',
                        'body': seat.seatNumber
                    },
                    {
                        'header': 'CLASS',
                        'body': seat.seatType
                    },
                    {
                        'header': 'PRICE',
                        'body': `$${seat.price}`
                    }
                ],
                'infoModuleData': {
                    'labelValueRows': [
                        {
                            'columns': [
                                {
                                    'label': 'Confirmation #',
                                    'value': `${flight.id}-${seat.seatNumber}`
                                },
                                {
                                    'label': 'Date',
                                    'value': new Date(flight.departureTime).toLocaleDateString()
                                }
                            ]
                        }
                    ]
                }
            };

            const filename = `Boarding_Pass_${flight.id}_${seat.seatNumber}.json`;
            return { filename, passData };
        } catch (error) {
            console.error('Error generating Google Pay pass:', error);
            throw new Error('Failed to generate Google Pay pass');
        }
    }

    /**
     * Generate combined pass object for both Apple and Google
     * @param {Object} bookingData - Flight, seat, and passenger data
     * @returns {Object} - Both Apple and Google pass data
     */
    generateBothPasses(bookingData) {
        try {
            const applePass = this.generateAppleWalletPass(bookingData);
            const googlePass = this.generateGooglePayPass(bookingData);

            return {
                success: true,
                apple: applePass,
                google: googlePass,
                message: 'Passes generated successfully'
            };
        } catch (error) {
            console.error('Error generating passes:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get pass data as JSON (for API response)
     * @param {Object} bookingData - Flight, seat, and passenger data
     * @returns {Object} - Pass data suitable for API response
     */
    getPassJSON(bookingData) {
        const { flight, seat, user = 'Alexander S.' } = bookingData;

        return {
            success: true,
            passes: {
                apple: {
                    type: 'application/vnd.apple.pkpass',
                    filename: `Boarding_Pass_${flight.id}_${seat.seatNumber}.pkpass`,
                    description: 'Apple Wallet Pass'
                },
                google: {
                    type: 'application/json',
                    filename: `Boarding_Pass_${flight.id}_${seat.seatNumber}.json`,
                    description: 'Google Pay Pass'
                }
            },
            bookingDetails: {
                flight: flight.flightNumber || flight.id,
                origin: flight.origin,
                destination: flight.destination,
                seat: seat.seatNumber,
                seatType: seat.seatType,
                passenger: user,
                price: seat.price,
                departureTime: flight.departureTime
            }
        };
    }
}

export default new WalletPassService();
