/**
 * Controller for Wallet Pass generation endpoints
 * Handles Apple Wallet (.pkpass) and Google Pay pass generation
 */

import WalletPassService from '../services/WalletPassService.js';
import logger from '../utils/logger.js';

class WalletPassController {
    /**
     * Generate both Apple Wallet and Google Pay passes
     * POST /wallet-pass/generate
     */
    static async generatePasses(req, res) {
        try {
            const { flight, seat, user } = req.body;

            if (!flight || !seat) {
                return res.status(400).json({
                    success: false,
                    error: 'Missing required fields: flight and seat'
                });
            }

            const result = WalletPassService.generateBothPasses({
                flight,
                seat,
                user
            });

            if (!result.success) {
                return res.status(400).json(result);
            }

            logger.info(`Wallet passes generated for flight ${flight.id}, seat ${seat.seatNumber}`);

            res.json(result);
        } catch (error) {
            logger.error(`Error in generatePasses: ${error.message}`);
            res.status(500).json({
                success: false,
                error: 'Failed to generate passes'
            });
        }
    }

    /**
     * Get pass data (metadata only, no file)
     * POST /wallet-pass/info
     */
    static async getPassInfo(req, res) {
        try {
            const { flight, seat, user } = req.body;

            if (!flight || !seat) {
                return res.status(400).json({
                    success: false,
                    error: 'Missing required fields: flight and seat'
                });
            }

            const passInfo = WalletPassService.getPassJSON({
                flight,
                seat,
                user
            });

            res.json(passInfo);
        } catch (error) {
            logger.error(`Error in getPassInfo: ${error.message}`);
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve pass information'
            });
        }
    }

    /**
     * Download Apple Wallet pass (.pkpass)
     * POST /wallet-pass/download/apple
     */
    static async downloadApplePass(req, res) {
        try {
            const { flight, seat, user } = req.body;

            if (!flight || !seat) {
                return res.status(400).json({
                    success: false,
                    error: 'Missing required fields: flight and seat'
                });
            }

            const result = WalletPassService.generateAppleWalletPass({
                flight,
                seat,
                user
            });

            res.setHeader('Content-Type', 'application/vnd.apple.pkpass');
            res.setHeader(
                'Content-Disposition',
                `attachment; filename="${result.filename}"`
            );

            res.json(result.passData);

            logger.info(`Apple Wallet pass downloaded for flight ${flight.id}`);
        } catch (error) {
            logger.error(`Error downloading Apple pass: ${error.message}`);
            res.status(500).json({
                success: false,
                error: 'Failed to download Apple pass'
            });
        }
    }

    /**
     * Download Google Pay pass (JSON)
     * POST /wallet-pass/download/google
     */
    static async downloadGooglePass(req, res) {
        try {
            const { flight, seat, user } = req.body;

            if (!flight || !seat) {
                return res.status(400).json({
                    success: false,
                    error: 'Missing required fields: flight and seat'
                });
            }

            const result = WalletPassService.generateGooglePayPass({
                flight,
                seat,
                user
            });

            res.setHeader('Content-Type', 'application/json');
            res.setHeader(
                'Content-Disposition',
                `attachment; filename="${result.filename}"`
            );

            res.json(result.passData);

            logger.info(`Google Pay pass downloaded for flight ${flight.id}`);
        } catch (error) {
            logger.error(`Error downloading Google pass: ${error.message}`);
            res.status(500).json({
                success: false,
                error: 'Failed to download Google pass'
            });
        }
    }
}

export default WalletPassController;
