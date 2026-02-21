import { Database } from 'sqlite3';
import { VoucherRepository, Voucher } from '../repositories/voucher.repository';
import { ValidationError, NotFoundError } from '../middleware/error.middleware';

export interface VoucherValidationResult {
  valid: boolean;
  voucher?: Voucher;
  message?: string;
  discountAmount?: number;
  finalPrice?: number;
}

export class VoucherService {
  private voucherRepo: VoucherRepository;

  constructor(db: Database) {
    this.voucherRepo = new VoucherRepository(db);
  }

  /**
   * Validate a voucher code
   */
  async validateVoucher(
    code: string,
    restaurantId?: string,
    orderAmount?: number
  ): Promise<VoucherValidationResult> {
    // Validate input
    if (!code || code.trim().length === 0) {
      throw new ValidationError('Voucher code is required');
    }

    // Check if voucher exists
    const voucher = await this.voucherRepo.findByCode(code);
    if (!voucher) {
      throw new NotFoundError('Voucher not found');
    }

    // Validate voucher
    const validation = await this.voucherRepo.isValid(code, restaurantId);
    
    if (!validation.valid) {
      return {
        valid: false,
        voucher,
        message: validation.message
      };
    }

    // Calculate discount if order amount provided
    let discountAmount: number | undefined;
    let finalPrice: number | undefined;

    if (orderAmount !== undefined && validation.voucher) {
      discountAmount = this.voucherRepo.calculateDiscount(validation.voucher, orderAmount);
      discountAmount = Math.round(discountAmount * 100) / 100;
      finalPrice = Math.round((orderAmount - discountAmount) * 100) / 100;
      if(finalPrice <= 0){
        return {
          valid: false,
          voucher,
          message: "Final price is 0"
        };
      }
      return {
      valid: true,
      voucher,
      message: 'Voucher is valid',
      discountAmount,
      finalPrice
    };
    }

    

    return {
        valid: false,
        voucher,
        message: 'Voucher is invalid'
      };
  }

  /**
   * Get voucher by code
   */
  async getVoucherByCode(code: string): Promise<Voucher | null> {
    return this.voucherRepo.findByCode(code);
  }
}
