# Order Management API - Postman Testing Guide

## Setup

### 1. Create Test Data

Before testing the API, you need to create test data:

```bash
cd backend
npm run seed:orders
```

This creates:
- **Customers**: max.mustermann@test.com, anna.schmidt@test.com
- **Restaurant Owners**: owner@pizzamario.com, owner@burgerpalace.com
- **Restaurants**: Pizza Mario (Wien), Burger Palace (Wien)
- **Dishes**: Pizza Margherita, Pizza Salami, Spaghetti Carbonara, Cheeseburger
- **Vouchers**: WELCOME10, MARIO20, EXPIRED2025

All passwords: `Test1234!`

### 2. Start Backend Server

```bash
cd backend
npm run dev
```

Server will start on http://localhost:3000

### 3. Import Postman Collection

1. Open Postman
2. Click "Import" button
3. Import both files:
   - `Order-Management-API.postman_collection.json`
   - `Development.postman_environment.json`
4. Select "Development" environment from dropdown

## Testing Workflow

### Complete Happy Path Test (Full Order Lifecycle)

1. **Setup > Login as Customer (Max)**
   - Logs in as max.mustermann@test.com
   - Token is automatically saved to environment

2. **Vouchers > Validate Voucher - Valid Global**
   - Test voucher validation before order
   - Optional step to preview discount

3. **Customer - Place Orders > Create Order - Happy Path**
   - Creates order with 2x Margherita + 1x Salami
   - Order ID is saved automatically
   - Status: `pending`

4. **Setup > Login as Owner (Pizza Mario)**
   - Switch to restaurant owner account
   - Token is saved

5. **Restaurant Owner > Get Restaurant Orders - Filter Pending**
   - View all pending orders for Pizza Mario
   - Should see the order created in step 3

6. **Restaurant Owner > Accept Order**
   - Accept the pending order
   - Status changes to `accepted`

7. **Restaurant Owner > Update Status - Preparing**
   - Mark order as being prepared
   - Status: `preparing`

8. **Restaurant Owner > Update Status - Ready**
   - Mark order as ready for delivery
   - Status: `ready`

9. **Restaurant Owner > Update Status - Delivering**
   - Mark order as being delivered
   - Status: `delivering`

10. **Restaurant Owner > Update Status - Delivered**
    - Mark order as delivered
    - Status: `delivered`
    - Timestamp `deliveredAt` is set

11. **Switch back to Customer Token** (Setup > Login as Customer (Max))

12. **Customer - View Orders > Get Order Details by ID**
    - View the complete order with all status history
    - Should show all status transitions

### Test Voucher System

#### Valid Global Voucher
```
Vouchers > Validate Voucher - Valid Global
Code: WELCOME10
Result: 10% discount, valid for all restaurants
```

#### Restaurant-Specific Voucher
```
Vouchers > Validate Voucher - Restaurant Specific
Code: MARIO20
Result: 20% discount, only valid for Pizza Mario
```

#### Expired Voucher
```
Vouchers > Validate Voucher - Expired
Code: EXPIRED2025
Result: Error - voucher has expired
```

#### Create Order with Voucher
```
Customer - Place Orders > Create Order - With Voucher
Voucher: WELCOME10
Result: Discount is applied to final price
```

### Test Error Cases

#### Invalid Quantity
```
Customer - Place Orders > Create Order - Invalid Quantity (Error)
Quantity: 0
Expected: 422 Validation Error
```

#### Unauthorized Access
```
Customer - Place Orders > Create Order - Unauthorized (No Token)
No Authorization header
Expected: 401 Unauthorized
```

#### Access Another Customer's Order
```
Customer - View Orders > Get Order - Not Own Order (Error)
Login as Anna, try to access Max's order
Expected: 403 Forbidden
```

#### Invalid Status Transition
```
Restaurant Owner > Update Status - Invalid Transition (Error)
Try to change 'delivered' back to 'preparing'
Expected: 409 Conflict
```

## Collection Runner

To run all tests automatically:

1. Click on the collection name
2. Click "Run collection"
3. Select all folders or specific scenarios
4. Set delay between requests: 500ms (recommended)
5. Click "Run Order Management API"

**Note**: Some error tests may need to be excluded from automated runs if they depend on specific state.

## Key Endpoints Overview

### Customer Endpoints (require customer role)
- `POST /api/orders` - Create order
- `GET /api/orders` - Get own orders
- `GET /api/orders/:id` - Get order details

### Restaurant Owner Endpoints (require restaurant_owner role)
- `GET /api/restaurants/:restaurantId/orders` - Get restaurant orders
- `POST /api/orders/:id/accept` - Accept order
- `POST /api/orders/:id/reject` - Reject order
- `PATCH /api/orders/:id/status` - Update order status

### Public Endpoints (no auth required)
- `POST /api/vouchers/validate` - Validate voucher code

## Valid Status Transitions

```
pending → accepted | rejected | cancelled
accepted → preparing | cancelled
preparing → ready | cancelled
ready → delivering | cancelled
delivering → delivered | cancelled
rejected → (final state)
delivered → (final state)
cancelled → (final state)
```

## Environment Variables

The collection uses these environment variables:

- `baseUrl` - API base URL (default: http://localhost:3000)
- `customerToken` - JWT token for customer (Max)
- `customerToken2` - JWT token for customer (Anna)
- `ownerToken` - JWT token for Pizza Mario owner
- `ownerToken2` - JWT token for Burger Palace owner
- `orderId` - ID of created order (auto-saved)
- `pizzaMarioId` - Restaurant ID (auto-saved on owner login)

Tokens are automatically set by login requests.

## Common Issues

### 404 Restaurant/Dish Not Found
- Run `npm run seed:orders` to create test data
- Check that server is running
- Verify baseUrl in environment

### 403 Forbidden
- Check that correct token is used (customer vs owner)
- Verify user owns the resource being accessed

### 409 Conflict - Restaurant Closed
- Seeded restaurants are open Mo-So
- Check system time is correct
- Verify opening_hours data in database

### 422 Validation Error
- Check request body format
- Verify all required fields
- Check quantity is 1-99

## Tips

1. **Reset Order State**: To test accept/reject again, create a new order first
2. **Restaurant IDs**: Use environment variables instead of hardcoding
3. **Test Isolation**: Create separate orders for different test scenarios
4. **Voucher Limits**: MARIO20 has usage_limit=5, may need reset after multiple runs

## Database Inspection

To verify data directly:

```bash
cd backend
sqlite3 food-delivery.db

# View orders
SELECT id, order_status, final_price FROM orders;

# View order items
SELECT * FROM order_items WHERE order_id = '<order-id>';

# View status history
SELECT * FROM order_status_history WHERE order_id = '<order-id>';

# View voucher usage
SELECT code, usage_count, usage_limit FROM vouchers;
```

## Support

If tests fail:
1. Check server logs for errors
2. Verify database migrations ran successfully
3. Ensure test data was seeded
4. Check that ports are not blocked (3000)
5. Verify no CORS issues in browser console (if testing from browser)
