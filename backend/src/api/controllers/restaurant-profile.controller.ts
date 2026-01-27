import { Request, Response } from 'express';
import { RestaurantProfileService, ValidationError, UpdateRestaurantProfileData } from '../../business/restaurant-profile.service';

export class RestaurantProfileController {
  constructor(private restaurantProfileService: RestaurantProfileService) {}

  /**
   * GET /api/restaurants/profile
   * Get restaurant profile for the logged-in restaurant owner
   */
  async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const ownerId = user?.sub || user?.userId;

      if (!ownerId) {
        res.status(401).json({ message: 'Nicht authentifiziert' });
        return;
      }

      const restaurant = await this.restaurantProfileService.getRestaurantProfile(ownerId);

      if (!restaurant) {
        res.status(404).json({ message: 'Restaurant nicht gefunden' });
        return;
      }

      // Convert opening hours to API format
      const openingHoursFormatted = this.formatOpeningHoursForResponse(restaurant.openingHours);

      res.json({
        id: restaurant.id,
        name: restaurant.name,
        address: {
          street: restaurant.street,
          houseNumber: restaurant.houseNumber,
          staircase: restaurant.staircase,
          door: restaurant.door,
          postalCode: restaurant.postalCode,
          city: restaurant.city
        },
        contactEmail: restaurant.contactEmail || '',
        contactPhone: restaurant.contactPhone,
        categories: restaurant.categories,
        openingHours: openingHoursFormatted
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

      const updateData: UpdateRestaurantProfileData = {};

      // Extract fields from request body
      if (req.body.name !== undefined) {
        updateData.name = req.body.name;
      }

      if (req.body.contactEmail !== undefined) {
        updateData.contactEmail = req.body.contactEmail;
      }

      if (req.body.contactPhone !== undefined) {
        updateData.contactPhone = req.body.contactPhone;
      }

      if (req.body.categories !== undefined) {
        updateData.categories = req.body.categories;
      }

      if (req.body.openingHours !== undefined) {
        updateData.openingHours = req.body.openingHours;
      }

      // Update profile
      const updatedRestaurant = await this.restaurantProfileService.updateRestaurantProfile(
        ownerId,
        updateData
      );

      // Convert opening hours to API format
      const openingHoursFormatted = this.formatOpeningHoursForResponse(updatedRestaurant.openingHours);

      res.json({
        id: updatedRestaurant.id,
        name: updatedRestaurant.name,
        address: {
          street: updatedRestaurant.street,
          houseNumber: updatedRestaurant.houseNumber,
          staircase: updatedRestaurant.staircase,
          door: updatedRestaurant.door,
          postalCode: updatedRestaurant.postalCode,
          city: updatedRestaurant.city
        },
        contactEmail: updatedRestaurant.contactEmail || '',
        contactPhone: updatedRestaurant.contactPhone,
        categories: updatedRestaurant.categories,
        openingHours: openingHoursFormatted
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

  /**
   * Format opening hours from repository format to API format
   */
  private formatOpeningHoursForResponse(openingHours: any[]): any[] {
    const dayMap: { [key: number]: string } = {
      0: 'sunday',
      1: 'monday',
      2: 'tuesday',
      3: 'wednesday',
      4: 'thursday',
      5: 'friday',
      6: 'saturday'
    };

    // Group by day of week
    const grouped: { [key: number]: any[] } = {};
    for (const hour of openingHours) {
      if (!grouped[hour.dayOfWeek]) {
        grouped[hour.dayOfWeek] = [];
      }
      grouped[hour.dayOfWeek].push(hour);
    }

    // Convert to API format
    const result: any[] = [];
    for (let day = 0; day <= 6; day++) {
      const dayHours = grouped[day] || [];
      const dayName = dayMap[day];

      if (dayHours.length === 0 || dayHours[0].isClosed) {
        // Closed day
        result.push({
          dayOfWeek: dayName,
          isClosed: true,
          timeSlots: []
        });
      } else {
        // Open day with time slots
        const timeSlots = dayHours.map(hour => ({
          start: hour.openTime,
          end: hour.closeTime
        }));

        result.push({
          dayOfWeek: dayName,
          isClosed: false,
          timeSlots
        });
      }
    }

    return result;
  }
}
