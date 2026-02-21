import { Request, Response, NextFunction } from 'express';
import { VoucherService } from '../../business/voucher.service';

export class VoucherController {
  constructor(private voucherService: VoucherService) {}

  /**
   * POST /api/vouchers/validate - Validate a voucher code
   */
  validateVoucher = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      console.log('backend received voucher:', req.body)
      const code = req.body.voucherCode
      const orderAmount = req.body.orderAmount
      const restaurantId = {} as string
      console.log('backend checking voucher:', code, restaurantId, orderAmount)
      const result = await this.voucherService.validateVoucher(code, restaurantId, orderAmount);

      console.log('voucher send back:', result)
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };
}
