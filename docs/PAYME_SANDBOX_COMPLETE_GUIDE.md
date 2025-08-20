# Complete Payme Sandbox Testing Guide

## 🎯 **Overview**
Complete step-by-step guide for testing Payme integration using the official sandbox at `https://test.paycom.uz/`

## 📋 **Prerequisites Setup**

### 1. **Access Payme Sandbox**
- URL: `https://test.paycom.uz/`
- **Merchant ID**: `68944508cab302211ad21b06`
- **TEST_KEY**: `zpcK%c1JZsPnGwqO09Wfx4CFU%wP2d9BqAmD`
- **Endpoint URL**: `https://arguably-sunny-garfish.ngrok-free.app/api/payme/pay`

### 2. **Account Type Settings**
- **Account Type**: `Одноразовый` (One-time account) - for e-commerce orders
- **Account Status**: `Ожидает оплаты` (Awaiting payment)

### 3. **Available Test Data**
```json
{
  "account": { "order_id": "42" },
  "amount": 500000,  // 5000 UZS in tiyin
  "account_type": "one-time"
}
```

---

## 🧪 **Testing Scenarios Overview**

Payme sandbox tests **2 main scenarios**:
1. **Scenario 1**: Creation and cancellation of unconfirmed transaction
2. **Scenario 2**: Creation, confirmation, and cancellation of confirmed transaction

---

## 📝 **Scenario 1: Unconfirmed Transaction Flow**

### **Step 1: Security Tests**

#### **1.1 Test Invalid Authorization**
- **Location**: `Неверные данные` → `Неверная авторизация`
- **Expected Error**: `-32504`
- **Expected Message**: `"Недостаточно привилегий для выполнения метода"`
- **Purpose**: Verify proper authentication handling

#### **1.2 Test Invalid Amount**
- **Location**: `Неверные данные` → `Неверная сумма`
- **Test Data**: Valid order_id + Wrong amount
- **Expected Error**: `-31001`
- **Expected Message**: `"Неверная сумма"`
- **Affected Methods**: `CheckPerformTransaction`, `CreateTransaction`

#### **1.3 Test Non-existent Account**
- **Location**: `Неверные данные` → `Несуществующий счёт`
- **Test Data**: Valid amount + Wrong order_id
- **Expected Error**: `-31050` to `-31099`
- **Expected Message**: `"Неверный код заказа"`
- **Affected Methods**: `CheckPerformTransaction`, `CreateTransaction`

### **Step 2: Valid Transaction Flow**

#### **2.1 CheckPerformTransaction**
- **Location**: `Платежные запросы` → `CheckPerformTransaction`
- **Request**:
  ```json
  {
    "jsonrpc": "2.0",
    "method": "CheckPerformTransaction",
    "params": {
      "account": { "order_id": "42" },
      "amount": 500000
    }
  }
  ```
- **Expected Response**: `{ "result": { "allow": true } }`
- **Expected Status**: ✅ Success (no errors)

#### **2.2 CreateTransaction**
- **Location**: `Платежные запросы` → `CreateTransaction`
- **Account Status**: `В ожидании оплаты`
- **Account Type**: `Одноразовый`
- **Expected Responses**:
  1. **First call**: Success with transaction creation
  2. **Repeat call**: Same response (idempotency)
  3. **CheckTransaction**: Success with transaction details
  4. **New transaction attempt**: Error `-31008` ("Невозможно выполнить операцию")

#### **2.3 CancelTransaction**
- **Location**: `Платежные запросы` → `CancelTransaction`
- **Transaction State**: `1` (created)
- **Expected Response**: Success without errors
- **Expected Follow-up**: CheckTransaction shows cancelled state

---

## 📝 **Scenario 2: Confirmed Transaction Flow**

### **Step 1: Transaction Creation**
Same as Scenario 1 steps 2.1 and 2.2

### **Step 2: PerformTransaction**
- **Location**: `Платежные запросы` → `PerformTransaction`
- **Transaction State**: `1` (created)
- **Expected Responses**:
  1. **First call**: Success with state change to `2`
  2. **Repeat call**: Same response (idempotency)
  3. **CheckTransaction**: Success showing performed state

### **Step 3: CancelTransaction**
- **Location**: `Платежные запросы` → `CancelTransaction`
- **Transaction State**: `2` (performed)
- **Expected Response**: Success with state change to `-2`
- **Expected Follow-up**: CheckTransaction shows cancelled state

---

## ⚠️ **Critical Error Responses**

### **Authentication Errors**
```json
{
  "error": {
    "code": -32504,
    "message": "Недостаточно привилегий для выполнения метода"
  }
}
```

### **Business Logic Errors**
```json
{
  "error": {
    "code": -31001,
    "message": {
      "uz": "Noto'g'ri summa",
      "ru": "Неверная сумма", 
      "en": "Incorrect amount"
    }
  }
}
```

```json
{
  "error": {
    "code": -31050,
    "message": {
      "uz": "Buyurtma topilmadi",
      "ru": "Заказ не найден",
      "en": "Order not found"
    }
  }
}
```

```json
{
  "error": {
    "code": -31008,
    "message": {
      "uz": "Biz operatsiyani bajara olmaymiz",
      "ru": "Мы не можем сделать операцию",
      "en": "We can't do operation"
    }
  }
}
```

---

## ✅ **Expected Success Responses**

### **CheckPerformTransaction**
```json
{
  "result": { "allow": true }
}
```

### **CreateTransaction**
```json
{
  "result": {
    "transaction": "68a3194e20cfb2025b9e9e45",
    "state": 1,
    "create_time": 1755519310389
  }
}
```

### **CheckTransaction**
```json
{
  "result": {
    "create_time": 1755519310389,
    "perform_time": null,
    "cancel_time": null,
    "transaction": "68a3194e20cfb2025b9e9e45",
    "state": 1,
    "reason": null
  }
}
```

### **PerformTransaction**
```json
{
  "result": {
    "perform_time": 1755519315000,
    "transaction": "68a3194e20cfb2025b9e9e45",
    "state": 2
  }
}
```

### **CancelTransaction**
```json
{
  "result": {
    "cancel_time": 1755519320000,
    "transaction": "68a3194e20cfb2025b9e9e45",
    "state": -1
  }
}
```

---

## 🔍 **Key Testing Requirements**

### **Idempotency Rules**
- `CreateTransaction`, `PerformTransaction`, `CancelTransaction` are called **twice**
- **First call**: May fail
- **Second call**: Must succeed
- **Repeat calls**: Must return identical responses

### **State Transitions**
1. **Created**: `state: 1`
2. **Performed**: `state: 2` 
3. **Cancelled (unconfirmed)**: `state: -1`
4. **Cancelled (confirmed)**: `state: -2`

### **Response Consistency**
- `CheckTransaction` must always return the same format
- All timestamps must be consistent across calls
- Transaction IDs must match exactly

---

## 🚀 **Testing Checklist**

### **Before Testing**
- [ ] Ngrok tunnel is active
- [ ] Server is running on port 4000
- [ ] Database has booking ID 42 with amount 5000 UZS
- [ ] Endpoint URL is configured in Payme merchant settings

### **During Testing**
- [ ] Run all security tests first (invalid auth, amount, account)
- [ ] Verify error codes match exactly
- [ ] Test complete unconfirmed transaction flow
- [ ] Test complete confirmed transaction flow
- [ ] Verify idempotency for all methods
- [ ] Check response format consistency

### **Success Criteria**
- [ ] All security tests return correct error codes
- [ ] All valid operations return success responses
- [ ] Idempotency works correctly
- [ ] State transitions are proper
- [ ] Response formats are consistent
- [ ] No unexpected errors in sandbox

Your API is now ready for comprehensive Payme sandbox testing! 🎉
