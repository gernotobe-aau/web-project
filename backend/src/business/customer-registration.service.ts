import { Database } from 'sqlite3';
import { CustomerRepository, CreateCustomerData } from '../repositories/customer.repository';
import { RestaurantOwnerRepository } from '../repositories/restaurant-owner.repository';
import { passwordService } from './password.service';
import { authService } from '../middleware/auth.middleware';
import config from '../config/config';

export interface CustomerRegistrationInput {
  firstName: string;
  lastName: string;
  birthDate: string;
  email: string;
  password: string;
  deliveryAddress: {
    street: string;
    houseNumber: string;
    staircase?: string;
    door?: string;
    postalCode: string;
    city: string;
  };
}

export interface ValidationError {
  field: string;
  message: string;
}

export class CustomerRegistrationService {
  private customerRepository: CustomerRepository;
  private ownerRepository: RestaurantOwnerRepository;

  constructor(db: Database) {
    this.customerRepository = new CustomerRepository(db);
    this.ownerRepository = new RestaurantOwnerRepository(db);
  }

  /**
   * Register a new customer with full validation
   */
  async registerCustomer(input: CustomerRegistrationInput): Promise<{
    customerId: string;
    accessToken: string;
  }> {
    // Validate all fields
    const errors = await this.validate(input);
    if (errors.length > 0) {
      throw new ValidationException(errors);
    }

    // Hash password
    const passwordHash = await passwordService.hashPassword(input.password);

    // Create customer data
    const createData: CreateCustomerData = {
      firstName: input.firstName,
      lastName: input.lastName,
      birthDate: input.birthDate,
      email: input.email,
      passwordHash,
      deliveryAddress: input.deliveryAddress
    };

    // Create customer in database
    const customer = await this.customerRepository.create(createData);

    // Generate JWT token
    const accessToken = authService.generateToken(customer.id, 'customer');

    return {
      customerId: customer.id,
      accessToken
    };
  }

  /**
   * Validate customer registration input
   */
  private async validate(input: CustomerRegistrationInput): Promise<ValidationError[]> {
    const errors: ValidationError[] = [];

    // Validate first name
    if (!input.firstName || input.firstName.trim().length === 0) {
      errors.push({ field: 'firstName', message: 'Vorname ist erforderlich' });
    } else if (input.firstName.length > 30) {
      errors.push({ field: 'firstName', message: 'Vorname darf maximal 30 Zeichen lang sein' });
    } else if (!/^[a-zA-ZäöüÄÖÜß\-\.]+$/.test(input.firstName)) {
      errors.push({ field: 'firstName', message: 'Vorname darf nur Buchstaben, Bindestrich und Punkt enthalten' });
    }

    // Validate last name
    if (!input.lastName || input.lastName.trim().length === 0) {
      errors.push({ field: 'lastName', message: 'Nachname ist erforderlich' });
    } else if (input.lastName.length > 30) {
      errors.push({ field: 'lastName', message: 'Nachname darf maximal 30 Zeichen lang sein' });
    } else if (!/^[a-zA-ZäöüÄÖÜß\-\.]+$/.test(input.lastName)) {
      errors.push({ field: 'lastName', message: 'Nachname darf nur Buchstaben, Bindestrich und Punkt enthalten' });
    }

    // Validate birth date and age
    if (!input.birthDate) {
      errors.push({ field: 'birthDate', message: 'Geburtsdatum ist erforderlich' });
    } else {
      const birthDate = new Date(input.birthDate);
      if (isNaN(birthDate.getTime())) {
        errors.push({ field: 'birthDate', message: 'Ungültiges Datumsformat' });
      } else {
        const age = this.calculateAge(birthDate);
        if (age < config.minAgeCustomer) {
          errors.push({ 
            field: 'birthDate', 
            message: `Sie müssen mindestens ${config.minAgeCustomer} Jahre alt sein` 
          });
        }
      }
    }

    // Validate email
    if (!input.email || input.email.trim().length === 0) {
      errors.push({ field: 'email', message: 'E-Mail ist erforderlich' });
    } else if (input.email.length > 255) {
      errors.push({ field: 'email', message: 'E-Mail darf maximal 255 Zeichen lang sein' });
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) {
      errors.push({ field: 'email', message: 'Ungültige E-Mail-Adresse' });
    } else {
      // Check if email already exists in customers table (case-insensitive)
      const existingCustomer = await this.customerRepository.findByEmail(input.email);
      if (existingCustomer) {
        errors.push({ field: 'email', message: 'E-Mail-Adresse wird bereits verwendet' });
      }
      
      // Check if email already exists in restaurant_owners table (system-wide uniqueness)
      const existingOwner = await this.ownerRepository.findByEmail(input.email);
      if (existingOwner) {
        errors.push({ field: 'email', message: 'E-Mail-Adresse wird bereits verwendet' });
      }
    }

    // Validate password
    if (!input.password || input.password.length === 0) {
      errors.push({ field: 'password', message: 'Passwort ist erforderlich' });
    } else if (input.password.length < 8) {
      errors.push({ field: 'password', message: 'Passwort muss mindestens 8 Zeichen lang sein' });
    }

    // Validate delivery address
    if (!input.deliveryAddress) {
      errors.push({ field: 'deliveryAddress', message: 'Lieferadresse ist erforderlich' });
    } else {
      const addr = input.deliveryAddress;

      if (!addr.street || addr.street.trim().length === 0) {
        errors.push({ field: 'deliveryAddress.street', message: 'Straße ist erforderlich' });
      } else if (addr.street.length > 100) {
        errors.push({ field: 'deliveryAddress.street', message: 'Straße darf maximal 100 Zeichen lang sein' });
      }

      if (!addr.houseNumber || addr.houseNumber.trim().length === 0) {
        errors.push({ field: 'deliveryAddress.houseNumber', message: 'Hausnummer ist erforderlich' });
      } else if (addr.houseNumber.length > 10) {
        errors.push({ field: 'deliveryAddress.houseNumber', message: 'Hausnummer darf maximal 10 Zeichen lang sein' });
      }

      if (addr.staircase && addr.staircase.length > 10) {
        errors.push({ field: 'deliveryAddress.staircase', message: 'Stiege darf maximal 10 Zeichen lang sein' });
      }

      if (addr.door && addr.door.length > 10) {
        errors.push({ field: 'deliveryAddress.door', message: 'Tür darf maximal 10 Zeichen lang sein' });
      }

      if (!addr.postalCode || addr.postalCode.trim().length === 0) {
        errors.push({ field: 'deliveryAddress.postalCode', message: 'Postleitzahl ist erforderlich' });
      } else if (!/^\d{4}$/.test(addr.postalCode)) {
        errors.push({ field: 'deliveryAddress.postalCode', message: 'Postleitzahl muss genau 4 Ziffern haben' });
      }

      if (!addr.city || addr.city.trim().length === 0) {
        errors.push({ field: 'deliveryAddress.city', message: 'Ort ist erforderlich' });
      } else if (addr.city.length > 100) {
        errors.push({ field: 'deliveryAddress.city', message: 'Ort darf maximal 100 Zeichen lang sein' });
      }
    }

    return errors;
  }

  private calculateAge(birthDate: Date): number {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }
}

export class ValidationException extends Error {
  constructor(public errors: ValidationError[]) {
    super('Validation failed');
    this.name = 'ValidationException';
  }
}
