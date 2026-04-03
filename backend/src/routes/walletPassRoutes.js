/**
 * Routes for Wallet Pass generation
 * Endpoints for Apple Wallet (.pkpass) and Google Pay
 */

import express from 'express';
import WalletPassController from '../controllers/WalletPassController.js';

const router = express.Router();

/**
 * POST /wallet-pass/generate
 * Generate both Apple Wallet and Google Pay passes
 */
router.post('/generate', WalletPassController.generatePasses);

/**
 * POST /wallet-pass/info
 * Get pass information without generating files
 */
router.post('/info', WalletPassController.getPassInfo);

/**
 * POST /wallet-pass/download/apple
 * Download Apple Wallet pass (.pkpass)
 */
router.post('/download/apple', WalletPassController.downloadApplePass);

/**
 * POST /wallet-pass/download/google
 * Download Google Pay pass (JSON format)
 */
router.post('/download/google', WalletPassController.downloadGooglePass);

export default router;
