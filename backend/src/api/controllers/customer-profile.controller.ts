import { Request, Response } from 'express';
import { CustomerProfileService, ValidationError, UpdateCustomerProfileData } from '../../business/customer-profile.service';

export class CustomerProfileController {
  constructor(private customerProfileService: CustomerProfileService) {}

  /**
   * GET /api/customers/profile
   * Get customer profile for the logged-in customer
   */
  async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const ownerId = user?.sub || user?.userId;

      if (!ownerId) {
        res.status(401).json({ message: 'Nicht authentifiziert' });
        return;
      }

      const customer = await this.customerProfileService.getCustomerProfile(ownerId);

      if (!customer) {
        res.status(404).json({ message: 'Kunde nicht gefunden' });
        return;
      }

      

      res.json({
        id: customer.id,
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        address: {
          street: customer.deliveryStreet,
          houseNumber: customer.deliveryHouseNumber,
          staircase: customer.deliveryStaircase,
          door: customer.deliveryDoor,
          postalCode: customer.deliveryPostalCode,
          city: customer.deliveryCity
        }
      });
    } catch (error) {
      console.error('Error in getProfile:', error);
      res.status(500).json({ message: 'Interner Serverfehler' });
    }
  }

  /**
   * PATCH /api/restaurants/profile
   * Update restaurant profile
   */
  async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const ownerId = user?.sub || user?.userId;

      if (!ownerId) {
        res.status(401).json({ message: 'Nicht authentifiziert' });
        return;
      }

      const updateData: UpdateCustomerProfileData = {};

      // Extract fields from request body
      if (req.body.firstName !== undefined) {
        updateData.firstName = req.body.firstName;
      }

      if (req.body.lastName !== undefined) {
        updateData.lastName = req.body.lastName;
      }

      if(req.body.birth_date !== undefined) {
        updateData.birthDate = req.body.birth_date;
      }

      if (req.body.email !== undefined) {
        updateData.email = req.body.email;
      }

      if (req.body.address !== undefined) {
        const address = req.body.address;
        updateData.deliveryAddress = {
          street: address.street,
          houseNumber: address.houseNumber,
          staircase: address.staircase,
          door: address.door,
          postalCode: address.postalCode,
          city: address.city
        };
      }

      // Update profile
      const updatedCustomer = await this.customerProfileService.updateCustomerProfile(
        ownerId,
        updateData
      );


      res.json({
        id: updatedCustomer.id,
        firstName: updatedCustomer.firstName,
        lastName: updatedCustomer.lastName,
        email: updatedCustomer.email,
        address: {
          street: updatedCustomer.deliveryStreet,
          houseNumber: updatedCustomer.deliveryHouseNumber,
          staircase: updatedCustomer.deliveryStaircase,
          door: updatedCustomer.deliveryDoor,
          postalCode: updatedCustomer.deliveryPostalCode,
          city: updatedCustomer.deliveryCity
        }
      });
    } catch (error) {
      if (error instanceof ValidationError) {
        res.status(422).json({
          errors: [
            {
              field: error.field,
              message: error.message
            }
          ]
        });
      } else if (error instanceof Error && error.message.includes('not found')) {
        res.status(404).json({ message: error.message });
      } else {
        console.error('Error in updateProfile:', error);
        res.status(500).json({ message: 'Interner Serverfehler' });
      }
    }
  }
}
