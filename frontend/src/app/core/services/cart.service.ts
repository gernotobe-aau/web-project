import { Injectable } from '@angular/core';
import { BehaviorSubject, empty, Observable } from 'rxjs';
import { Dish, MenuService } from './menu.service';
import { Cart, CartItem, CartByRestaurant, VoucherValidaton } from '../models/cart.model';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Restaurant, RestaurantService } from './restaurant.service';

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private cart: Cart = {} as Cart;
  //private cartItems: CartItem[] = [];
  private cartSubject
  public cart$
  private apiUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient, private restaurantService: RestaurantService, private menuService: MenuService) {
    this.cart.restaurants = []
    this.cartSubject = new BehaviorSubject<Cart>(this.cart);
    this.cart$ = this.cartSubject.asObservable();
    this.loadCart();
  }

  /**
   * load from backend and localstorage and compare by timestamp
   */
  loadCart(): void{
    console.log('loadcart call')
    this.loadFromBackEnd().subscribe({
      next: (c) => {
        // Load cart from localStorage
        console.log('From backend: ', c)
        let local = this.loadFromLocalStorage();
        if(c && !local || c && local && Date.parse(local.updatedAt) < Date.parse(c.updatedAt)){
          
          console.log('Loading from backend:', c)
          if(!c.restaurants){
            c.restaurants = []
          }
          this.cart = c;
        }else if(local){
          console.log('Loading from local:', local)
          if(!this.cart.restaurants){
            this.cart.restaurants = []
          }
          this.cart = local!;
        }else{
          this.cart = {} as Cart
          this.cart.restaurants = []
          console.log('No loading happened')
        }
        console.log('Loaded into this.cart:', this.cart)
        this.mapFromDTO(this.cart)
        .then(() => this.updateCart())
        .catch(err => {console.log('Error when updating cart:', err)})
      },
      error: (e) => {
        console.log("Error while loading from server, using local storage", e);
        let local = this.loadFromLocalStorage();
        if(typeof(local) !== undefined){
          this.cart = local!;
        }
      }
    });
    
  }

  /**
   * Add item to cart or increment quantity if already exists
   */
  addItem(dish: Dish, restaurantId: string, restaurantName: string, quantity: number = 1): void {
    console.log('restaurant Id: ', restaurantId)
    console.log('restaurants:', this.cart.restaurants)
    let existingRestaurant = this.cart?.restaurants.find((r) => r.restaurantId === restaurantId)
    if(!existingRestaurant){
      existingRestaurant = {restaurantId, restaurantName, items: [], totalItems: 0, totalPrice: 0}
      this.cart?.restaurants.push(existingRestaurant)
    }

    const existingItem = existingRestaurant.items.find((item) => item.dishId === dish.id);

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      existingRestaurant.items.push({dishId: dish.id, dishName: dish.name, quantity, restaurantId, restaurantName, pricePerUnit: dish.price});
    }

    this.updateCart();
  }

  /**
   * Remove item from cart completely
   */
  removeItem(dishId: number, restaurantId: string): void {
    let rest = this.cart.restaurants.find(r => r.restaurantId === restaurantId)
    if(rest){
      rest.items = rest.items.filter((item) => item.dishId !== dishId)
      if(rest.items.length === 0){
        this.cart.restaurants = this.cart.restaurants.filter(r => r.restaurantId !== restaurantId)
      }
    }
    this.updateCart();
  }

  /**
   * Update quantity for an item
   */
  updateQuantity(dishId: number, restaurantId: string, quantity: number): void {
    const restaurant = this.cart?.restaurants.find((r) => r.restaurantId === restaurantId)
    const item = restaurant?.items.find((item) => item.dishId === dishId);

    if (item) {
      if (quantity <= 0) {
        this.removeItem(dishId, restaurantId);
      } else {
        item.quantity = quantity;
        this.updateCart();
      }
    }
  }

  /**
   * Increment quantity by 1
   */
  incrementQuantity(dishId: number, restaurantId: string): void {
    const restaurant = this.cart?.restaurants.find((r) => r.restaurantId === restaurantId)
    const item = restaurant?.items.find((item) => item.dishId === dishId);
    if (item) {
      item.quantity++;
      this.updateCart();
    }
  }

  /**
   * Decrement quantity by 1
   */
  decrementQuantity(dishId: number, restaurantId: string): void {
    const restaurant = this.cart?.restaurants.find((r) => r.restaurantId === restaurantId)
    const item = restaurant?.items.find((item) => item.dishId === dishId);
    if (item) {
      if (item.quantity > 1) {
        item.quantity--;
      } else {
        this.removeItem(dishId, restaurantId);
      }
      this.updateCart();
    }
  }

  /**
   * Get cart items grouped by restaurant, filtering out restaurants/items with 0 items
   */
  getCartByRestaurant(): CartByRestaurant[] {
    return this.cart!.restaurants.filter((r) => r.totalItems > 0); // Hide restaurants with no items
  }

  /**
   * 
   * getter for Cart
   */
  getCart(): Cart{
    return this.cart!;
  }

  /**
   * Clear all items from cart
   */
  clear(): void {
    this.cart = {} as Cart;
    this.cart.restaurants = []
    this.updateCart();
  }

  /**
   * Get total items in cart
   */
  /*getTotalItems(): number {
    return this.cartItems.reduce((sum, item) => sum + item.quantity, 0);
  }*/

  private updateCart(): void {
    let totalSum = 0
    if(this.cart.restaurants){
      for(let restaurant of this.cart.restaurants){
        let sum = 0
        for(let item of restaurant.items){
          sum += item.pricePerUnit * item.quantity
        }
        restaurant.totalPrice = sum
        totalSum += restaurant.totalPrice
      }
    }
    this.cartSubject.next(this.cart);
    this.saveToLocalStorage();
    this.saveToBackEnd().subscribe();
  }

  private saveToLocalStorage(): void {
    localStorage.setItem('cart', JSON.stringify(this.cart));
  }

  private saveToBackEnd(): Observable<void> {
    console.log('saving to BackEnd')
    let cartDTO = this.mapToDTO(this.cart)
    console.log("Saving: ", cartDTO)
    return this.http.post<void>(`${this.apiUrl}/cart/cart`, cartDTO);
  }

  private mapToDTO(cart: Cart): any{
    console.log('mapping cart:', cart)
    let rItems = [] as CartItem[]
    if(cart.restaurants){
      rItems = cart.restaurants
      .filter(r => r.items && r.items.length > 0)
      .flatMap(r => r.items)
    console.log('map:', rItems)
    }
    return { ...cart, items: rItems }
  }

  private async mapFromDTO(cart: any): Promise<Cart>{
    console.log('mapping cart from DTO:', cart)
    const grouped = new Map<string, CartByRestaurant>();
    const dishes = new Map<string, Dish[]>();

    for(let item of cart.items){
      if (!grouped.has(item.restaurantId)) {
        let restaurant = {} as CartByRestaurant
        restaurant.items = []
        restaurant.restaurantId = item.restaurantId
        let r = await this.restaurantService.getRestaurantById(restaurant.restaurantId).toPromise()
          
        if(r){
          restaurant.restaurantName = r.name
        }else{
          console.log('no restaurant, skipping item:', item)
          continue
        }
        grouped.set(item.restaurantId, restaurant);
        let d = await this.menuService.getDishes(undefined, item.restaurantId).toPromise()
        if(d){
          dishes.set(item.restaurantId, d)
        }else{
          console.log('no dish, skipping item:', item)
        }
      }
      
      
      let dish = dishes.get(item.restaurantId)?.find(d => d.id === item.dishId)
      if(dish){
        item.dishName = dish.name
        item.pricePerUnit = dish.price
      }else{
        continue
      }
      let restaurant = grouped.get(item.restaurantId)
      if(restaurant){
        restaurant.items.push(item)
      }else{
        console.log('Error, no restaurant')
      }
      //grouped.get(item.restaurantId).items.push(item);
    }
    cart.restaurants = [...grouped.values()]
    console.log('mapped cart from DTO:', cart)
    return cart
  }

  private loadFromLocalStorage(): Cart | undefined {
    const saved = localStorage.getItem('cart');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        console.log("Error parsing saved Cart from local")
      }
    }
    return undefined
  }
  private loadFromBackEnd(): Observable<Cart> {
    return this.http.get<Cart>(`${this.apiUrl}/cart/cart`)
  }

  createOrder(): void{
    for(let r of this.cart.restaurants){
      if(r.items){
        this.http.post<void>(`${this.apiUrl}/orders`, {
          restaurantId: r.restaurantId,
          items: r.items,//{ dishId: number; quantity: number }[],
          voucherCode: this.cart.voucherCode,
          voucherId: this.cart.voucherId,
          customerNotes: this.cart.customerNotes
        }).subscribe({
          next: (c) =>{
            console.log('successfully seend order to backend:', c)
          },
          error: (e) =>{
            console.log('error creating orders:', e)
          }
        })
      } 
    }
    this.clear()  
  }



  validateVoucher(voucherCode: string, orderAmount: number): Observable<VoucherValidaton>{
    return this.http.post<VoucherValidaton>(`${this.apiUrl}/vouchers/validate`, { voucherCode, orderAmount});
  }
}
  