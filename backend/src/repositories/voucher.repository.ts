import { Database } from 'sqlite3';

export type DiscountType = 'percentage' | 'fixed_amount';

export interface Voucher {
  id: number;
  code: string;
  discountType: DiscountType;
  discountValue: number;
  isActive: boolean;
  validFrom: string;
  validUntil: string;
  usageLimit?: number;
  usageCount: number;
  restaurantId?: string;
  createdAt: string;
  updatedAt: string;
}

export class VoucherRepository {
  constructor(private db: Database) {}

  /**
   * Find voucher by code (case-insensitive)
   */
  findByCode(code: string): Promise<Voucher | null> {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM vouchers WHERE LOWER(code) = LOWER(?)';
      this.db.get(sql, [code], (err, row: any) => {
        if (err) return reject(err);
        resolve(row ? mapRowToVoucher(row) : null);
      });
    });
  }

  /**
   * Find voucher by ID
   */
  findById(id: number): Promise<Voucher | null> {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM vouchers WHERE id = ?';
      this.db.get(sql, [id], (err, row: any) => {
        if (err) return reject(err);
        resolve(row ? mapRowToVoucher(row) : null);
      });
    });
  }

  /**
   * Increment usage count for a voucher
   */
  incrementUsageCount(voucherId: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const sql = `
        UPDATE vouchers 
        SET usage_count = usage_count + 1, updated_at = ?
        WHERE id = ?
      `;
      const now = new Date().toISOString();

      this.db.run(sql, [now, voucherId], (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  }

  /**
   * Check if voucher is valid
   */
  async isValid(
    code: string,
    restaurantId?: string,
    currentTime?: Date
  ): Promise<{ valid: boolean; voucher?: Voucher; message?: string }> {
    const voucher = await this.findByCode(code);
    
    if (!voucher) {
      return { valid: false, message: 'Voucher not found' };
    }

    if (!voucher.isActive) {
      return { valid: false, voucher, message: 'Voucher is not active' };
    }

    const now = currentTime || new Date();
    const validFrom = new Date(voucher.validFrom);
    const validUntil = new Date(voucher.validUntil);

    if (now < validFrom) {
      return { valid: false, voucher, message: 'Voucher not yet valid' };
    }

    if (now > validUntil) {
      return { valid: false, voucher, message: 'Voucher has expired' };
    }

    if (voucher.usageLimit !== null && voucher.usageLimit !== undefined && voucher.usageCount >= voucher.usageLimit) {
      return { valid: false, voucher, message: 'Usage limit reached' };
    }

    // Check restaurant-specific voucher
    if (voucher.restaurantId && restaurantId && voucher.restaurantId !== restaurantId) {
      return { valid: false, voucher, message: 'Voucher not valid for this restaurant' };
    }

    return { valid: true, voucher };
  }

  /**
   * Calculate discount amount
   */
  calculateDiscount(voucher: Voucher, orderAmount: number): number {
    if (voucher.discountType === 'percentage') {
      return Math.round(orderAmount * (voucher.discountValue / 100) * 100) / 100;
    } else {
      // Fixed amount discount, but not more than order amount
      return Math.min(voucher.discountValue, orderAmount);
    }
  }
}

// Helper function to map database row to Voucher object
function mapRowToVoucher(row: any): Voucher {
  return {
    id: row.id,
    code: row.code,
    discountType: row.discount_type as DiscountType,
    discountValue: row.discount_value,
    isActive: row.is_active === 1,
    validFrom: row.valid_from,
    validUntil: row.valid_until,
    usageLimit: row.usage_limit,
    usageCount: row.usage_count,
    restaurantId: row.restaurant_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}
