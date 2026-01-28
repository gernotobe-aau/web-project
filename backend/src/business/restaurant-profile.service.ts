import { RestaurantRepository, Restaurant, OpeningHour } from '../repositories/restaurant.repository';

export interface UpdateRestaurantProfileData {
  name?: string;
  contactEmail?: string;
  contactPhone?: string;
  categories?: string[];
  openingHours?: OpeningHoursData[];
}

export interface OpeningHoursData {
  dayOfWeek: string; // monday, tuesday, etc.
  isClosed: boolean;
  timeSlots: TimeSlot[];
}

export interface TimeSlot {
  start: string; // HH:MM format
  end: string;   // HH:MM format
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

export class RestaurantProfileService {
  constructor(private restaurantRepository: RestaurantRepository) {}

  /**
   * Get restaurant profile by owner ID
   */
  async getRestaurantProfile(ownerId: string): Promise<Restaurant | null> {
    const restaurants = await this.restaurantRepository.findByOwnerId(ownerId);
    
    if (restaurants.length === 0) {
      return null;
    }

    // Return the first restaurant (in this iteration, one owner = one restaurant)
    return restaurants[0];
  }

  /**
   * Update restaurant profile
   */
  async updateRestaurantProfile(
    ownerId: string,
    updateData: UpdateRestaurantProfileData
  ): Promise<Restaurant> {
    // Get restaurant by owner
    const restaurant = await this.getRestaurantProfile(ownerId);
    
    if (!restaurant) {
      throw new Error('Restaurant not found for this owner');
    }

    // Validate all fields that are being updated
    if (updateData.name !== undefined) {
      this.validateRestaurantName(updateData.name);
      await this.checkNameUniqueness(updateData.name, restaurant.city, restaurant.id);
    }

    if (updateData.contactEmail !== undefined) {
      this.validateContactEmail(updateData.contactEmail);
    }

    if (updateData.contactPhone !== undefined && updateData.contactPhone !== null && updateData.contactPhone !== '') {
      this.validateContactPhone(updateData.contactPhone);
    }

    if (updateData.categories !== undefined) {
      this.validateCategories(updateData.categories);
    }

    if (updateData.openingHours !== undefined) {
      this.validateOpeningHours(updateData.openingHours);
    }

    // Update restaurant name if provided
    if (updateData.name !== undefined) {
      await this.restaurantRepository.updateName(restaurant.id, updateData.name);
    }

    // Update contact info if provided
    if (updateData.contactEmail !== undefined || updateData.contactPhone !== undefined) {
      const contactEmail = updateData.contactEmail !== undefined ? updateData.contactEmail : restaurant.contactEmail;
      const contactPhone = updateData.contactPhone !== undefined ? updateData.contactPhone : restaurant.contactPhone;
      
      await this.restaurantRepository.updateContactInfo(restaurant.id, {
        email: contactEmail || undefined,
        phone: contactPhone
      });
    }

    // Update categories if provided
    if (updateData.categories !== undefined) {
      // Normalize categories to lowercase
      const normalizedCategories = updateData.categories.map(c => c.toLowerCase());
      await this.restaurantRepository.updateCategories(restaurant.id, normalizedCategories);
    }

    // Update opening hours if provided
    if (updateData.openingHours !== undefined) {
      const openingHours = this.convertToRepositoryFormat(updateData.openingHours);
      await this.restaurantRepository.updateOpeningHours(restaurant.id, openingHours);
    }

    // Fetch and return updated restaurant
    const updatedRestaurant = await this.restaurantRepository.findById(restaurant.id);
    
    if (!updatedRestaurant) {
      throw new Error('Failed to fetch updated restaurant');
    }

    return updatedRestaurant;
  }

  /**
   * Validate restaurant name
   */
  private validateRestaurantName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new ValidationError('Restaurantname ist erforderlich', 'name');
    }

    if (name.length > 100) {
      throw new ValidationError('Restaurantname darf maximal 100 Zeichen lang sein', 'name');
    }

    const nameRegex = /^[a-zA-Z0-9äöüÄÖÜß\.\-\/\s]+$/;
    if (!nameRegex.test(name)) {
      throw new ValidationError(
        'Restaurantname darf nur Buchstaben, Zahlen, Punkt, Bindestrich, Schrägstrich und Leerzeichen enthalten',
        'name'
      );
    }
  }

  /**
   * Check if restaurant name is unique in the same city
   */
  private async checkNameUniqueness(name: string, city: string, currentRestaurantId: string): Promise<void> {
    const existingRestaurant = await this.restaurantRepository.findByNameAndCity(name, city);
    
    if (existingRestaurant && existingRestaurant.id !== currentRestaurantId) {
      throw new ValidationError('Restaurantname existiert bereits in diesem Ort', 'name', 422);
    }
  }

  /**
   * Validate contact email
   */
  private validateContactEmail(email: string): void {
    if (!email || email.trim().length === 0) {
      throw new ValidationError('Kontakt-E-Mail ist erforderlich', 'contactEmail');
    }

    if (email.length > 50) {
      throw new ValidationError('Kontakt-E-Mail darf maximal 50 Zeichen lang sein', 'contactEmail');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new ValidationError('Bitte geben Sie eine gültige E-Mail-Adresse ein', 'contactEmail');
    }
  }

  /**
   * Validate contact phone
   */
  private validateContactPhone(phone: string): void {
    if (phone.length > 20) {
      throw new ValidationError('Telefonnummer darf maximal 20 Zeichen lang sein', 'contactPhone');
    }

    const phoneRegex = /^[\d\+\-\s\(\)]*$/;
    if (!phoneRegex.test(phone)) {
      throw new ValidationError(
        'Telefonnummer darf nur Zahlen, +, -, Leerzeichen und Klammern enthalten',
        'contactPhone'
      );
    }
  }

  /**
   * Validate categories
   */
  private validateCategories(categories: string[]): void {
    if (!Array.isArray(categories) || categories.length === 0) {
      throw new ValidationError('Mindestens eine Kategorie ist erforderlich', 'categories');
    }

    const config = require('../config/config').default;
    const validCategories = config.cuisineCategories;
    const validCategoriesLowerCase = validCategories.map((c: string) => c.toLowerCase());

    for (const category of categories) {
      if (!validCategoriesLowerCase.includes(category.toLowerCase())) {
        throw new ValidationError(
          `Ungültige Kategorie: ${category}. Erlaubte Kategorien: ${validCategories.join(', ')}`,
          'categories'
        );
      }
    }
  }

  /**
   * Validate opening hours
   */
  private validateOpeningHours(openingHours: OpeningHoursData[]): void {
    const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    
    // Check that all 7 days are present
    if (openingHours.length !== 7) {
      throw new ValidationError('Öffnungszeiten müssen für alle 7 Wochentage angegeben werden', 'openingHours');
    }

    const providedDays = openingHours.map(oh => oh.dayOfWeek.toLowerCase());
    for (const day of validDays) {
      if (!providedDays.includes(day)) {
        throw new ValidationError(`Öffnungszeiten für ${day} fehlen`, 'openingHours');
      }
    }

    // Validate each day
    for (const dayHours of openingHours) {
      this.validateDayOpeningHours(dayHours);
    }
  }

  /**
   * Validate opening hours for a single day
   */
  private validateDayOpeningHours(dayHours: OpeningHoursData): void {
    const dayName = this.getDayDisplayName(dayHours.dayOfWeek);

    // If closed, time slots must be empty
    if (dayHours.isClosed) {
      if (dayHours.timeSlots.length > 0) {
        throw new ValidationError(
          `${dayName}: Wenn geschlossen, dürfen keine Zeitfenster angegeben werden`,
          'openingHours'
        );
      }
      return;
    }

    // If not closed, must have at least one time slot
    if (dayHours.timeSlots.length === 0) {
      throw new ValidationError(
        `${dayName}: Mindestens ein Zeitfenster ist erforderlich oder markieren Sie den Tag als geschlossen`,
        'openingHours'
      );
    }

    // Validate each time slot
    for (let i = 0; i < dayHours.timeSlots.length; i++) {
      const slot = dayHours.timeSlots[i];
      this.validateTimeSlot(slot, dayName, i + 1);
    }

    // Check for overlaps
    this.checkTimeSlotOverlaps(dayHours.timeSlots, dayName);
  }

  /**
   * Validate a single time slot
   */
  private validateTimeSlot(slot: TimeSlot, dayName: string, slotNumber: number): void {
    const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;

    if (!timeRegex.test(slot.start)) {
      throw new ValidationError(
        `${dayName}, Zeitfenster ${slotNumber}: Ungültiges Zeitformat für Startzeit (erwartet HH:MM)`,
        'openingHours'
      );
    }

    if (!timeRegex.test(slot.end)) {
      throw new ValidationError(
        `${dayName}, Zeitfenster ${slotNumber}: Ungültiges Zeitformat für Endzeit (erwartet HH:MM)`,
        'openingHours'
      );
    }

    // Check that start is before end
    const startMinutes = this.timeToMinutes(slot.start);
    const endMinutes = this.timeToMinutes(slot.end);

    if (startMinutes >= endMinutes) {
      throw new ValidationError(
        `${dayName}, Zeitfenster ${slotNumber}: Startzeit muss vor Endzeit liegen`,
        'openingHours'
      );
    }
  }

  /**
   * Check for overlapping time slots
   */
  private checkTimeSlotOverlaps(timeSlots: TimeSlot[], dayName: string): void {
    for (let i = 0; i < timeSlots.length; i++) {
      for (let j = i + 1; j < timeSlots.length; j++) {
        if (this.timeSlotsOverlap(timeSlots[i], timeSlots[j])) {
          throw new ValidationError(
            `${dayName}: Zeitfenster ${i + 1} und ${j + 1} überschneiden sich`,
            'openingHours'
          );
        }
      }
    }
  }

  /**
   * Check if two time slots overlap
   */
  private timeSlotsOverlap(slot1: TimeSlot, slot2: TimeSlot): boolean {
    const start1 = this.timeToMinutes(slot1.start);
    const end1 = this.timeToMinutes(slot1.end);
    const start2 = this.timeToMinutes(slot2.start);
    const end2 = this.timeToMinutes(slot2.end);

    return (start1 < end2 && start2 < end1);
  }

  /**
   * Convert time string (HH:MM) to minutes since midnight
   */
  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Get display name for day of week
   */
  private getDayDisplayName(day: string): string {
    const dayMap: { [key: string]: string } = {
      'monday': 'Montag',
      'tuesday': 'Dienstag',
      'wednesday': 'Mittwoch',
      'thursday': 'Donnerstag',
      'friday': 'Freitag',
      'saturday': 'Samstag',
      'sunday': 'Sonntag'
    };
    return dayMap[day.toLowerCase()] || day;
  }

  /**
   * Convert opening hours from API format to repository format
   */
  private convertToRepositoryFormat(openingHours: OpeningHoursData[]): OpeningHour[] {
    const dayMap: { [key: string]: number } = {
      'monday': 1,
      'tuesday': 2,
      'wednesday': 3,
      'thursday': 4,
      'friday': 5,
      'saturday': 6,
      'sunday': 0
    };

    const result: OpeningHour[] = [];

    for (const dayHours of openingHours) {
      const dayOfWeek = dayMap[dayHours.dayOfWeek.toLowerCase()];

      if (dayHours.isClosed || dayHours.timeSlots.length === 0) {
        // Closed day
        result.push({
          dayOfWeek,
          isClosed: true,
          openTime: undefined,
          closeTime: undefined
        });
      } else {
        // For each time slot, create a separate entry
        for (const slot of dayHours.timeSlots) {
          result.push({
            dayOfWeek,
            isClosed: false,
            openTime: slot.start,
            closeTime: slot.end
          });
        }
      }
    }

    return result;
  }
}
