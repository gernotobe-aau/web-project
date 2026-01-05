import { Database } from 'sqlite3';
import { RestaurantOwnerRepository, CreateRestaurantOwnerData } from '../repositories/restaurant-owner.repository';
import { CustomerRepository } from '../repositories/customer.repository';
import { RestaurantRepository, CreateRestaurantData, OpeningHour } from '../repositories/restaurant.repository';
import { passwordService } from './password.service';
import { authService } from '../middleware/auth.middleware';
import config from '../config/config';
import { ValidationError, ValidationException } from './customer-registration.service';

export interface RestaurantOwnerRegistrationInput {
  firstName: string;
  lastName: string;
  birthDate: string;
  email: string;
  password: string;
  restaurant: {
    name: string;
    address: {
      street: string;
      houseNumber: string;
      staircase?: string;
      door?: string;
      postalCode: string;
      city: string;
    };
    categories: string[];
    contactInfo: {
      phone: string;
      email?: string;
    };
    openingHours: OpeningHour[];
  };
}

export class RestaurantOwnerRegistrationService {
  private ownerRepository: RestaurantOwnerRepository;
  private customerRepository: CustomerRepository;
  private restaurantRepository: RestaurantRepository;

  constructor(db: Database) {
    this.ownerRepository = new RestaurantOwnerRepository(db);
    this.customerRepository = new CustomerRepository(db);
    this.restaurantRepository = new RestaurantRepository(db);
  }

  /**
   * Register a new restaurant owner with their restaurant
   */
  async registerRestaurantOwner(input: RestaurantOwnerRegistrationInput): Promise<{
    ownerId: string;
    restaurantId: string;
    accessToken: string;
  }> {
    // Validate all fields
    const errors = await this.validate(input);
    if (errors.length > 0) {
      throw new ValidationException(errors);
    }

    // Hash password
    const passwordHash = await passwordService.hashPassword(input.password);

    // Create owner data
    const ownerData: CreateRestaurantOwnerData = {
      firstName: input.firstName,
      lastName: input.lastName,
      birthDate: input.birthDate,
      email: input.email,
      passwordHash
    };

    // Create owner
    const owner = await this.ownerRepository.create(ownerData);

    // Create restaurant data
    const restaurantData: CreateRestaurantData = {
      ownerId: owner.id,
      name: input.restaurant.name,
      address: input.restaurant.address,
      contactInfo: input.restaurant.contactInfo,
      categories: input.restaurant.categories,
      openingHours: input.restaurant.openingHours
    };

    // Create restaurant
    const restaurant = await this.restaurantRepository.create(restaurantData);

    // Generate JWT token
    const accessToken = authService.generateToken(owner.id, 'restaurantOwner');

    return {
      ownerId: owner.id,
      restaurantId: restaurant.id,
      accessToken
    };
  }

  /**
   * Validate restaurant owner registration input
   */
  private async validate(input: RestaurantOwnerRegistrationInput): Promise<ValidationError[]> {
    const errors: ValidationError[] = [];

    // Validate first name (same as customer)
    if (!input.firstName || input.firstName.trim().length === 0) {
      errors.push({ field: 'firstName', message: 'Vorname ist erforderlich' });
    } else if (input.firstName.length > 30) {
      errors.push({ field: 'firstName', message: 'Vorname darf maximal 30 Zeichen lang sein' });
    } else if (!/^[a-zA-ZäöüÄÖÜß\-\.]+$/.test(input.firstName)) {
      errors.push({ field: 'firstName', message: 'Vorname darf nur Buchstaben, Bindestrich und Punkt enthalten' });
    }

    // Validate last name (same as customer)
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
        if (age < config.minAgeRestaurantOwner) {
          errors.push({ 
            field: 'birthDate', 
            message: `Sie müssen mindestens ${config.minAgeRestaurantOwner} Jahre alt sein` 
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
      // Check if email already exists in restaurant_owners table (case-insensitive)
      const existingOwner = await this.ownerRepository.findByEmail(input.email);
      if (existingOwner) {
        errors.push({ field: 'email', message: 'E-Mail-Adresse wird bereits verwendet' });
      }
      
      // Check if email already exists in customers table (system-wide uniqueness)
      const existingCustomer = await this.customerRepository.findByEmail(input.email);
      if (existingCustomer) {
        errors.push({ field: 'email', message: 'E-Mail-Adresse wird bereits verwendet' });
      }
    }

    // Validate password
    if (!input.password || input.password.length === 0) {
      errors.push({ field: 'password', message: 'Passwort ist erforderlich' });
    } else if (input.password.length < 8) {
      errors.push({ field: 'password', message: 'Passwort muss mindestens 8 Zeichen lang sein' });
    }

    // Validate restaurant
    if (!input.restaurant) {
      errors.push({ field: 'restaurant', message: 'Restaurant-Informationen sind erforderlich' });
    } else {
      // Validate restaurant name
      if (!input.restaurant.name || input.restaurant.name.trim().length === 0) {
        errors.push({ field: 'restaurant.name', message: 'Restaurantname ist erforderlich' });
      } else if (input.restaurant.name.length < 2) {
        errors.push({ field: 'restaurant.name', message: 'Restaurantname muss mindestens 2 Zeichen lang sein' });
      } else if (input.restaurant.name.length > 100) {
        errors.push({ field: 'restaurant.name', message: 'Restaurantname darf maximal 100 Zeichen lang sein' });
      } else if (!/^[a-zA-ZäöüÄÖÜß0-9\.\-\/\s]+$/.test(input.restaurant.name)) {
        errors.push({ 
          field: 'restaurant.name', 
          message: 'Restaurantname darf nur Buchstaben, Zahlen, Punkt, Bindestrich und Schrägstrich enthalten' 
        });
      } else if (input.restaurant.address && input.restaurant.address.city) {
        // Check if restaurant name is unique in the same city
        const existing = await this.restaurantRepository.findByNameAndCity(
          input.restaurant.name, 
          input.restaurant.address.city
        );
        if (existing) {
          errors.push({ 
            field: 'restaurant.name', 
            message: 'Ein Restaurant mit diesem Namen existiert bereits in diesem Ort' 
          });
        }
      }

      // Validate restaurant address
      if (!input.restaurant.address) {
        errors.push({ field: 'restaurant.address', message: 'Restaurant-Adresse ist erforderlich' });
      } else {
        const addr = input.restaurant.address;

        if (!addr.street || addr.street.trim().length === 0) {
          errors.push({ field: 'restaurant.address.street', message: 'Straße ist erforderlich' });
        } else if (addr.street.length > 100) {
          errors.push({ field: 'restaurant.address.street', message: 'Straße darf maximal 100 Zeichen lang sein' });
        }

        if (!addr.houseNumber || addr.houseNumber.trim().length === 0) {
          errors.push({ field: 'restaurant.address.houseNumber', message: 'Hausnummer ist erforderlich' });
        } else if (addr.houseNumber.length > 10) {
          errors.push({ field: 'restaurant.address.houseNumber', message: 'Hausnummer darf maximal 10 Zeichen lang sein' });
        }

        if (addr.staircase && addr.staircase.length > 10) {
          errors.push({ field: 'restaurant.address.staircase', message: 'Stiege darf maximal 10 Zeichen lang sein' });
        }

        if (addr.door && addr.door.length > 10) {
          errors.push({ field: 'restaurant.address.door', message: 'Tür darf maximal 10 Zeichen lang sein' });
        }

        if (!addr.postalCode || addr.postalCode.trim().length === 0) {
          errors.push({ field: 'restaurant.address.postalCode', message: 'Postleitzahl ist erforderlich' });
        } else if (!/^\d{4}$/.test(addr.postalCode)) {
          errors.push({ field: 'restaurant.address.postalCode', message: 'Postleitzahl muss genau 4 Ziffern haben' });
        }

        if (!addr.city || addr.city.trim().length === 0) {
          errors.push({ field: 'restaurant.address.city', message: 'Ort ist erforderlich' });
        } else if (addr.city.length > 100) {
          errors.push({ field: 'restaurant.address.city', message: 'Ort darf maximal 100 Zeichen lang sein' });
        }
      }

      // Validate categories
      if (!input.restaurant.categories || input.restaurant.categories.length === 0) {
        errors.push({ field: 'restaurant.categories', message: 'Mindestens eine Kategorie ist erforderlich' });
      } else {
        const validCategories = config.cuisineCategories.map(c => c.toLowerCase());
        for (const category of input.restaurant.categories) {
          if (!validCategories.includes(category.toLowerCase())) {
            errors.push({ 
              field: 'restaurant.categories', 
              message: `Ungültige Kategorie: ${category}. Erlaubte Kategorien: ${config.cuisineCategories.join(', ')}` 
            });
          }
        }
      }

      // Validate contact info
      if (!input.restaurant.contactInfo) {
        errors.push({ field: 'restaurant.contactInfo', message: 'Kontaktinformationen sind erforderlich' });
      } else {
        if (!input.restaurant.contactInfo.phone || input.restaurant.contactInfo.phone.trim().length === 0) {
          errors.push({ field: 'restaurant.contactInfo.phone', message: 'Telefonnummer ist erforderlich' });
        } else if (input.restaurant.contactInfo.phone.length > 20) {
          errors.push({ field: 'restaurant.contactInfo.phone', message: 'Telefonnummer darf maximal 20 Zeichen lang sein' });
        } else if (!/^[\+\d\s\-\(\)\/]+$/.test(input.restaurant.contactInfo.phone)) {
          errors.push({ field: 'restaurant.contactInfo.phone', message: 'Ungültiges Telefonnummer-Format' });
        }

        if (input.restaurant.contactInfo.email && input.restaurant.contactInfo.email.length > 0) {
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.restaurant.contactInfo.email)) {
            errors.push({ field: 'restaurant.contactInfo.email', message: 'Ungültige Kontakt-E-Mail-Adresse' });
          }
        }
      }

      // Validate opening hours
      if (!input.restaurant.openingHours || input.restaurant.openingHours.length !== 7) {
        errors.push({ 
          field: 'restaurant.openingHours', 
          message: 'Öffnungszeiten für alle 7 Wochentage sind erforderlich' 
        });
      } else {
        for (const hour of input.restaurant.openingHours) {
          if (hour.dayOfWeek < 0 || hour.dayOfWeek > 6) {
            errors.push({ 
              field: 'restaurant.openingHours', 
              message: 'Wochentag muss zwischen 0 (Sonntag) und 6 (Samstag) sein' 
            });
          }

          if (!hour.isClosed) {
            if (!hour.openTime || !hour.closeTime) {
              errors.push({ 
                field: 'restaurant.openingHours', 
                message: `Öffnungs- und Schließzeit sind für Tag ${hour.dayOfWeek} erforderlich` 
              });
            } else {
              // Validate time format (HH:MM)
              if (!/^\d{2}:\d{2}$/.test(hour.openTime) || !/^\d{2}:\d{2}$/.test(hour.closeTime)) {
                errors.push({ 
                  field: 'restaurant.openingHours', 
                  message: `Ungültiges Zeitformat für Tag ${hour.dayOfWeek}. Erwartet: HH:MM` 
                });
              } else if (hour.openTime >= hour.closeTime) {
                errors.push({ 
                  field: 'restaurant.openingHours', 
                  message: `Öffnungszeit muss vor Schließzeit liegen für Tag ${hour.dayOfWeek}` 
                });
              }
            }
          }
        }
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
