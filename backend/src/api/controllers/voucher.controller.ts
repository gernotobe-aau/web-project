import { Request, Response, NextFunction } from 'express';
import { VoucherService } from '../../business/voucher.service';

export class VoucherController {
  constructor(private voucherService: VoucherService) {}

  /**
   * POST /api/vouchers/validate - Validate a voucher code
   */
  validateVoucher = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { code, restaurantId, orderAmount } = req.body;

      const result = await this.voucherService.validateVoucher(code, restaurantId, orderAmount);

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };
}
