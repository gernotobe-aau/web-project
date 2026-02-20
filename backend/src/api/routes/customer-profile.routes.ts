import { Router } from 'express';
import { CustomerProfileController } from '../controllers/customer-profile.controller';
import { getDb } from '../../db/init';
import { CustomerRepository } from '../../repositories/customer.repository';
import { CustomerProfileService } from '../../business/customer-profile.service';
import { requireAuth } from '../../middleware/auth.middleware';

const router = Router();

// Lazy initialization for controller
let customerProfileController: CustomerProfileController | null = null;

function getCustomerProfileController(): CustomerProfileController {
  if (!customerProfileController) {
    const db = getDb();
    const customerRepository = new CustomerRepository(db);
    const customerProfileService = new CustomerProfileService(customerRepository);
    customerProfileController = new CustomerProfileController(customerProfileService);
  }
  return customerProfileController;
}

// All routes require authentication
router.use(requireAuth);

// GET /api/customers/profile - Get customer profile
router.get('/profile', async (req, res) => {
  const controller = getCustomerProfileController();
  await controller.getProfile(req, res);
});

// PATCH /api/customers/profile - Update customer profile
router.patch('/profile', async (req, res) => {
  const controller = getCustomerProfileController();
  await controller.updateProfile(req, res);
});

export default router;
