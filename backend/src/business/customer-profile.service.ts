import { CustomerRepository, Customer } from '../repositories/customer.repository';

export interface UpdateCustomerProfileData {
  firstName?: string;
  lastName?: string;
  birthDate?: string;
  email?: string;
  deliveryAddress?: {
    street: string;
    houseNumber: string;
    staircase?: string;
    door?: string;
    postalCode: string;
    city: string;
  };
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public field: string,
    public statusCode: number = 422
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class CustomerProfileService {
  constructor(private customerRepository: CustomerRepository) {}

  /**
   * Get customer profile by owner ID
   */
  async getCustomerProfile(Id: string): Promise<Customer | null> {
    const customers = await this.customerRepository.findById(Id);

    return customers;
  }

  /**
   * Update customer profile
   */
  async updateCustomerProfile(
    Id: string,
    updateData: UpdateCustomerProfileData
  ): Promise<Customer> {
    // Get customer by ID
    const customer = await this.getCustomerProfile(Id);
    
    if (!customer) {
      throw new Error('Customer not found');
    }

    const firstName = updateData.firstName ?? customer.firstName;
    const lastName = updateData.lastName ?? customer.lastName;
    // Validate all fields that are being updated
    await this.customerRepository.updateName(customer.id, firstName, lastName);

    if (updateData.email !== undefined) {
      this.validateEmail(updateData.email);
    }

    // Update contact info if provided
    if (updateData.email !== undefined) {
      const email = updateData.email !== undefined ? updateData.email : customer.email;
      
      await this.customerRepository.updateEmail(customer.id, email);
    }

    if (updateData.deliveryAddress !== undefined) {
      await this.customerRepository.updateDeliveryAddress(
        customer.id,
        updateData.deliveryAddress);
    }

    // Fetch and return updated customer
    const updatedCustomer = await this.customerRepository.findById(customer.id);
    
    if (!updatedCustomer) {
      throw new Error('Failed to fetch updated customer');
    }

    return updatedCustomer;
  }

  /**
   * Validate customer first name
   */
  private validateCustomerFirstName(firstName: string): void {
    if (!firstName || firstName.trim().length === 0) {
      throw new ValidationError('Kundenname ist erforderlich', 'firstName');
    }

    if (firstName.length > 100) {
      throw new ValidationError('Kundenname darf maximal 100 Zeichen lang sein', 'firstName');
    }

    const nameRegex = /^[a-zA-Z0-9äöüÄÖÜß\.\-\/\s]+$/;
    if (!nameRegex.test(firstName)) {
      throw new ValidationError(
        'Kundenname darf nur Buchstaben, Zahlen, Punkt, Bindestrich, Schrägstrich und Leerzeichen enthalten',
        'firstName'
      );
    }
  }

  /**
   * Validate last name
   */
  private validateCustomerLastName(lastName: string): void {
    if (!lastName || lastName.trim().length === 0) {
      throw new ValidationError('Nachname ist erforderlich', 'lastName');
    }

    if (lastName.length > 100) {
      throw new ValidationError('Nachname darf maximal 100 Zeichen lang sein', 'lastName');
    }

    const lastNameRegex = /^[a-zA-Z0-9äöüÄÖÜß\.\-\/\s]+$/;
    if (!lastNameRegex.test(lastName)) {
      throw new ValidationError(
        'Nachname darf nur Buchstaben, Zahlen, Punkt, Bindestrich, Schrägstrich und Leerzeichen enthalten',
        'lastName'
      );
    }
  }

  /**
   * Validate contact email
   */
  private validateEmail(email: string): void {
    if (!email || email.trim().length === 0) {
      throw new ValidationError('Kontakt-E-Mail ist erforderlich', 'email');
    }

    if (email.length > 50) {
      throw new ValidationError('Kontakt-E-Mail darf maximal 50 Zeichen lang sein', 'email');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new ValidationError('Bitte geben Sie eine gültige E-Mail-Adresse ein', 'email');
    }
  }

  /**
   * Validate delivery address
   */
  private validateDeliveryAddress(address: { street: string; houseNumber: string; staircase?: string; door?: string; postalCode: string; city: string }): void {
    if (!address) {
      throw new ValidationError('Lieferadresse ist erforderlich', 'address');
    }
    if (!address.street || address.street.trim().length === 0) {
      throw new ValidationError('Straße ist erforderlich', 'address.street');
    }
    if (address.street.length > 100) {
      throw new ValidationError('Straße darf maximal 100 Zeichen lang sein', 'address.street');
    }
    if (!address.houseNumber || address.houseNumber.trim().length === 0) {
      throw new ValidationError('Hausnummer ist erforderlich', 'address.houseNumber');
    }
    if (address.houseNumber.length > 10) {
      throw new ValidationError('Hausnummer darf maximal 10 Zeichen lang sein', 'address.houseNumber');
    }
    if (address.staircase && address.staircase.length > 10) {
      throw new ValidationError('Treppenhaus darf maximal 10 Zeichen lang sein', 'address.staircase');
    }
    if (address.door && address.door.length > 10) {
      throw new ValidationError('Tür darf maximal 10 Zeichen lang sein', 'address.door');
    }
    if (!address.postalCode || address.postalCode.trim().length === 0) {
      throw new ValidationError('Postleitzahl ist erforderlich', 'address.postalCode');
    }
    if (address.postalCode.length > 10) {
      throw new ValidationError('Postleitzahl darf maximal 10 Zeichen lang sein', 'address.postalCode');
    }
    if (!address.city || address.city.trim().length === 0) {
      throw new ValidationError('Stadt ist erforderlich', 'address.city');
    }
    if (address.city.length > 50) {
      throw new ValidationError('Stadt darf maximal 50 Zeichen lang sein', 'address.city'); 
    }  
  }
}
