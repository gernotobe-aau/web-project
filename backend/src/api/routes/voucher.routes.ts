import { Router } from 'express';
import { VoucherController } from '../controllers/voucher.controller';
import { VoucherService } from '../../business/voucher.service';
import { getDb } from '../../db/init';

const router = Router();

// Lazy-initialize controller to avoid calling getDb during module load
let voucherController: VoucherController | null = null;
function getController(): VoucherController {
  if (!voucherController) {
    const voucherService = new VoucherService(getDb());
    voucherController = new VoucherController(voucherService);
  }
  return voucherController;
}

// Public route - no auth required
router.post('/vouchers/validate', (req, res, next) =>
  getController().validateVoucher(req, res, next)
);

export default router;
