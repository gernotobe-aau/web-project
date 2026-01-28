# Analytics API Documentation

This document describes the Analytics API endpoints for restaurant owners to view statistics about their orders and dishes.

## Endpoints

### 1. Get Daily Order Count

Get the number of orders for the current day.

**Endpoint:** `GET /api/analytics/orders/daily`

**Authentication:** Required (Restaurant Owner only)

**Request Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "date": "2026-01-28",
  "orderCount": 42
}
```

**Business Rules:**
- Only counts orders with status 'accepted' or higher (excludes 'pending', 'rejected', 'cancelled')
- Date range: 00:00:00 to 23:59:59 of the current day
- Only returns data for the restaurant owned by the authenticated user

**Error Responses:**
- `401 Unauthorized`: Missing or invalid authentication token
- `403 Forbidden`: User is not a restaurant owner
- `500 Internal Server Error`: Unexpected server error

---

### 2. Get Weekly Order Count

Get the number of orders for the current week (Monday - Sunday).

**Endpoint:** `GET /api/analytics/orders/weekly`

**Authentication:** Required (Restaurant Owner only)

**Request Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "weekStart": "2026-01-27",
  "weekEnd": "2026-02-02",
  "weekNumber": 4,
  "orderCount": 187
}
```

**Business Rules:**
- Week starts on Monday at 00:00:00 and ends on Sunday at 23:59:59
- Only counts orders with status 'accepted' or higher
- Week number is ISO week number (week containing January 4 is week 1)
- Only returns data for the restaurant owned by the authenticated user

**Error Responses:**
- `401 Unauthorized`: Missing or invalid authentication token
- `403 Forbidden`: User is not a restaurant owner
- `500 Internal Server Error`: Unexpected server error

---

### 3. Get Top Dishes

Get the most ordered dishes for the current month.

**Endpoint:** `GET /api/analytics/dishes/top`

**Authentication:** Required (Restaurant Owner only)

**Query Parameters:**
- `limit` (optional, integer, 1-50): Number of top dishes to return (default: 10)

**Request Headers:**
```
Authorization: Bearer <token>
```

**Example Request:**
```
GET /api/analytics/dishes/top?limit=10
```

**Response (200 OK):**
```json
{
  "period": "month",
  "periodStart": "2026-01-01",
  "periodEnd": "2026-01-31",
  "dishes": [
    {
      "dishId": 42,
      "dishName": "Pizza Margherita",
      "orderCount": 87,
      "totalQuantity": 102
    },
    {
      "dishId": 15,
      "dishName": "Spaghetti Carbonara",
      "orderCount": 65,
      "totalQuantity": 78
    }
  ]
}
```

**Business Rules:**
- Period is the current month (first day to last day)
- Only counts dishes from orders with status 'accepted' or higher
- `orderCount`: Number of distinct orders containing this dish
- `totalQuantity`: Total quantity ordered across all orders
- Results are sorted by orderCount descending, then totalQuantity descending
- If a dish has been deleted from the menu, it still appears in statistics
- Returns empty array if no orders in the current month
- Only returns data for the restaurant owned by the authenticated user

**Error Responses:**
- `401 Unauthorized`: Missing or invalid authentication token
- `403 Forbidden`: User is not a restaurant owner
- `500 Internal Server Error`: Unexpected server error

---

## Authorization

All analytics endpoints require:
1. Valid JWT token in the `Authorization` header
2. User must have role `restaurantOwner`
3. User must own a restaurant
4. Only data for the user's own restaurant is returned

## Testing with Postman

See the Postman collection: `backend/postman/Order-Management-API.postman_collection.json`

The collection includes the following test cases:
1. **Get Daily Order Count** - Test successful retrieval of daily statistics
2. **Get Weekly Order Count** - Test successful retrieval of weekly statistics
3. **Get Top Dishes** - Test successful retrieval of top dishes with limit parameter
4. **Get Analytics - No Auth (Error)** - Test 401 response without authentication
5. **Get Analytics - Customer Token (Error)** - Test 403 response with customer role

## Example Workflow

1. Login as restaurant owner:
   ```
   POST /api/auth/login
   {
     "email": "owner@restaurant.com",
     "password": "password"
   }
   ```

2. Use the returned token for analytics requests:
   ```
   GET /api/analytics/orders/daily
   Authorization: Bearer <token>
   ```

3. The API returns statistics for your restaurant only.
